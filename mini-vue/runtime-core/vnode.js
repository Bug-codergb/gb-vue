import ShapeFlags from "../shared/src/shapeFlags";
const createVode = (type, props, children) => {
  const vnode = {
    el: null,
    type,
    props,
    children,
    key: props?.key,
    component: null,
    shapeFlag:getShapeFlag(type)
  }
  //为设虚拟节点设置 shapeShape;
  if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children ==="string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }
}
function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

export const Text = Symbol('Text');
export const Fragment = Symbol("Fragment");
export {
  createVode
}