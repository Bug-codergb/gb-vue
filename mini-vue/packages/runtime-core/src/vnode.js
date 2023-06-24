import ShapeFlags from "../../shared/src/shapeFlags.js";
import { isString } from "../../shared/src/general.js";
export const createVNode = _createVNode;
function _createVNode(type, props, children, patchFlag, dynamicProps, isBlockNode) {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : __FEATURE_SUSPENSE__ && isSuspense(type)
    ? ShapeFlags.SUSPENSE
    : isTeleport(type)
    ? ShapeFlags.TELEPORT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0

  return createBaseVNode(
    type,
    props,
    children,
    patchFlag,
    dynamicProps,
    shapeFlag,
    isBlockNode
  );
}
function createBaseVNode(
  type,
  props,
  children,
  patchFlag = 0,
  dynamicProps = null,
  shapeFlag,
  isBlockNode,
  needFullChildrenNormalization = false
) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null,
    ctx: currentRenderingInstance
  } 
  //为设虚拟节点设置 shapeShape;
  if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children ==="string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
  return vnode;
}
function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

export const Text = Symbol('Text');
export const Fragment = Symbol("Fragment");


export function createTextVNode(text,flag) {
  return createVNode(Text, null, text, flag);
}
export {
  createBaseVNode as createElementVNode
}