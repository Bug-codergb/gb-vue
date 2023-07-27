import { ConstantTypes, ElementTypes, NodeTypes } from '../ast.js';
import { PatchFlags } from '../../../shared/src/patchFlags.js';

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
  let hoisteCount = 0;

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
          hoisteCount++;
          continue;
        }
      }
    }

    if (child.type === NodeTypes.ELEMENT) {
      walk(child, context);
    }
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
        const returnType = ConstantTypes.CAN_STRINGIFY;
      }
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
    default:
  }
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
