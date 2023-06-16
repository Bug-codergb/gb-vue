import {
  NodeTypes, ElementTypes
} from "../ast.js";
import { findProp } from "../utils.js";
export const transformElement = (node, context) => {
  return function postTransformElement() {
    node = context.currentNode;
    if (
      !(node.type === NodeTypes.ELEMENT &&
        (node.tagType === ElementTypes.ELEMENT || node.tagType === ElementTypes.COMPONENT))
    ) {
      return;
    }

    const { tag, props } = node;
    const isComponent = node.tagType === ElementTypes.COMPONENT;

    let vnodeTag = isComponent ? resolveComponentType(node,context) : `"${tag}"`;
  }
}
export function resolveComponentType(node,context,ssr) {
  let { tag } = node;
  //动态组件
  const isExplicitDynamic = isComponentTag(tag);
  const isProps = findProp(node, is);
}
function isComponentTag(tag) {
  return tag === 'component' || tag === 'Component';
}