import {
  ConstantTypes, ElementTypes, NodeTypes, getVNodeBlockHelper, createArrayExpression,
} from '../ast.js';
import { PatchFlags } from '../../../shared/src/patchFlags.js';
import { isString, isSymbol, isArray } from '../../../shared/src/general.js';
import {
  OPEN_BLOCK,
  GUARD_REACTIVE_PROPS,
  NORMALIZE_CLASS,
  NORMALIZE_PROPS,
  NORMALIZE_STYLE,
} from '../runtimeHelpers.js';

export function isSingleElementRoot(
  root,
  child,
) {
  const { children } = root;
  return (
    children.length === 1
    && child.type === NodeTypes.ELEMENT
  );
}

export function hoistStatic(root, context) {
  walk(root, context, isSingleElementRoot(root, root.children[0]));
}

function walk(node, context, doNotHoistNode) {
  const { children } = node;
  const originalCount = children.length;
  let hoistedCount = 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.type === NodeTypes.ELEMENT
      && child.tagType === ElementTypes.ELEMENT
    ) {
      const constantType = doNotHoistNode ? ConstantTypes.NOT_CONSTANT : getConstantType(child, context);
      if (constantType > ConstantTypes.NOT_CONSTANT) {
        if (constantType >= ConstantTypes.CAN_HOIST) {
          child.codegenNode.patchFlag = `${PatchFlags.HOISTED} /* HOISTED */`;
          child.codegenNode = context.hoist(child.codegenNode);
          hoistedCount++;
          continue;
        }
      } else {
        const { codegenNode } = child;
        if (codegenNode.type === NodeTypes.VNODE_CALL) {
          const flag = getPatchFlag(codegenNode);
          if (
            (!flag || flag === PatchFlags.NEED_PATCH
            || flag === PatchFlags.TEXT) && getGeneratePropsConstantType(child, context) >= ConstantTypes.CAN_HOIST
          ) {
            const props = getNodeProps(child);
            if (props) {
              codegenNode.props = context.hoist(props);
            }
          }
          if (codegenNode.dynamicProps) {
            codegenNode.dynamicProps = context.hoist(codegenNode.dynamicProps);
          }
        }
      }
    }

    if (child.type === NodeTypes.ELEMENT) {
      const isComponent = child.tagType === ElementTypes.COMPONENT;
      if (isComponent) {
        context.scopes.vSlot++;
      }
      walk(child, context);
      if (isComponent) {
        context.scopes.vSlot--;
      }
    } else if (child.type === NodeTypes.FOR) {
      // Do not hoist v-for single child because it has to be a block
      walk(child, context, child.children.length === 1);
    } else if (child.type === NodeTypes.IF) {
      for (let i = 0; i < child.branches.length; i++) {
        // Do not hoist v-if single child because it has to be a block
        walk(
          child.branches[i],
          context,
          child.branches[i].children.length === 1,
        );
      }
    }
  }
  if (hoistedCount && context.transformHoist) {
    context.transformHoist(children, context, node);
  }

  // all children were hoisted - the entire children array is hoistable.
  if (
    hoistedCount
    && hoistedCount === originalCount
    && node.type === NodeTypes.ELEMENT
    && node.tagType === ElementTypes.ELEMENT
    && node.codegenNode
    && node.codegenNode.type === NodeTypes.VNODE_CALL
    && isArray(node.codegenNode.children)
  ) {
    node.codegenNode.children = context.hoist(
      createArrayExpression(node.codegenNode.children),
    );
  }
}

export function getConstantType(node, context) {
  const { constantCache } = context;
  switch (node.type) {
    case NodeTypes.ELEMENT:
      if (node.tagType !== ElementTypes.ELEMENT) {
        return ConstantTypes.NOT_CONSTANT;
      }
      const cached = constantCache.get(node);
      if (cached !== undefined) {
        return cached;
      }
      const { codegenNode } = node;
      if (codegenNode.type !== NodeTypes.VNODE_CALL) {
        return ConstantTypes.NOT_CONSTANT;
      }
      if (codegenNode.isBlock && node.tag !== 'svg' && node.tag !== 'foreignObject') {
        return ConstantTypes.NOT_CONSTANT;
      }
      const flag = getPatchFlag(codegenNode);
      if (!flag) {
        let returnType = ConstantTypes.CAN_STRINGIFY;
        const generatedPropsType = getGeneratePropsConstantType(node, context);
        if (generatedPropsType === ConstantTypes.NOT_CONSTANT) {
          return ConstantTypes.NOT_CONSTANT;
        }
        if (generatedPropsType < returnType) {
          returnType = generatedPropsType;
        }

        for (let i = 0; i < node.children.length; i++) {
          const chilType = getConstantType(node.children[i], context);
          if (chilType === ConstantTypes.NOT_CONSTANT) {
            return ConstantTypes.NOT_CONSTANT;
          }
          if (chilType < returnType) {
            returnType = chilType;
          }
        }

        if (returnType > ConstantTypes.CAN_SKIP_PATCH) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === NodeTypes.DIRECTIVE && p.name === 'bind' && p.exp) {
              const expType = getConstantType(p.exp, context);
              if (expType === ConstantTypes.NOT_CONSTANT) {
                constantCache.set(node, ConstantTypes.NOT_CONSTANT);
                return ConstantTypes.NOT_CONSTANT;
              }
              if (expType < returnType) {
                returnType = expType;
              }
            }
          }
        }
        if (codegenNode.isBlock) {
          for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === NodeTypes.DIRECTIVE) {
              return ConstantTypes.NOT_CONSTANT;
            }
          }

          context.removeHelper(OPEN_BLOCK);
          context.removeHelper(
            getVNodeBlockHelper(context.inSSR, codegenNode.isComponent),
          );
          codegenNode.isBlock = false;
          context.helper(getVNodeBlockHelper(context.inSSR, codegenNode, codegenNode.isComponent));
        }
        return returnType;
      }
      return ConstantTypes.NOT_CONSTANT;
    case NodeTypes.TEXT:
    case NodeTypes.COMMENT:
      return ConstantTypes.CAN_STRINGIFY;
    case NodeTypes.IF:
    case NodeTypes.FOR:
    case NodeTypes.IF_BRANCH:
      return ConstantTypes.NOT_CONSTANT;
    case NodeTypes.INTERPOLATION:
    case NodeTypes.TEXT_CALL:
      return getConstantType(node.content, context);
    case NodeTypes.SIMPLE_EXPRESSION:
      return node.constType;
    case NodeTypes.COMPOUND_EXPRESSION:
      let returnType = ConstantTypes.CAN_STRINGIFY;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (isString(child) || isSymbol(child)) {
          continue;
        }
        const childType = getConstantType(child, context);
        if (childType === ConstantTypes.NOT_CONSTANT) {
          return ConstantTypes.NOT_CONSTANT;
        } if (childType < returnType) {
          returnType = childType;
        }
      }
      return returnType;
    default:
      return ConstantTypes.NOT_CONSTANT;
  }
}

const allowHoistedHelperSet = new Set([
  NORMALIZE_CLASS,
  NORMALIZE_STYLE,
  NORMALIZE_PROPS,
  GUARD_REACTIVE_PROPS,
]);

function getConstantTypeOfHelperCall(value, context) {
  if (value.type === NodeTypes.JS_CALL_EXPRESSION && !isString(value.callee) && allowHoistedHelperSet.has(value.callee)) {
    const arg = value.arguments[0];
    if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
      return getConstantType(arg, context);
    } if (arg.type === NodeTypes.JS_CALL_EXPRESSION) {
      return getConstantTypeOfHelperCall(arg, context);
    }
  }
  return ConstantTypes.NOT_CONSTANT;
}
function getGeneratePropsConstantType(node, context) {
  let returnType = ConstantTypes.CAN_STRINGIFY;
  const props = getNodeProps(node);
  if (props && props.type === NodeTypes.JS_OBJECT_EXPRESSION) {
    const { properties } = props;
    for (let i = 0; i < properties.length; i++) {
      const { key, value } = properties[i];
      const keyType = getConstantType(key, context);
      if (keyType === ConstantTypes.NOT_CONSTANT) {
        return keyType;
      }
      if (keyType < returnType) {
        returnType = keyType;
      }
      let valueType;
      if (value.type === NodeTypes.SIMPLE_EXPRESSION) {
        valueType = getConstantType(value, context);
      } else if (value.type === NodeTypes.JS_CALL_EXPRESSION) {
        valueType = getConstantTypeOfHelperCall(value, context);
      } else {
        valueType = ConstantTypes.NOT_CONSTANT;
      }
      if (valueType === ConstantTypes.NOT_CONSTANT) {
        return valueType;
      }
      if (valueType < returnType) {
        returnType = valueType;
      }
    }
  }
  return returnType;
}
function getNodeProps(node) {
  const { codegenNode } = node;
  if (codegenNode.type === NodeTypes.VNODE_CALL) {
    return codegenNode.props;
  }
}
function getPatchFlag(node) {
  const flag = node.patchFlag;
  return flag ? parseInt(flag, 10) : undefined;
}
