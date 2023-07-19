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
    default:
  }
}
