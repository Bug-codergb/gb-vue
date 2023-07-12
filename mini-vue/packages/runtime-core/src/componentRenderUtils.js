import ShapeFlags from '../../shared/src/shapeFlags.js';

export function renderComponentRoot(instance) {
  const {
    type: Component,
    vnode,
    proxy,
    withProxy,
    props,
    propsOptions: [propsOptions],
    slots,
    attrs,
    emit,
    render,
    data,
    setupState,
    ctx,
    renderCache,
  } = instance;
  let result;
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    const proxyToUse = setupState;// withProxy || proxy;

    result = render.call(
      proxyToUse,
      proxyToUse,
    );
  }

  return result;
}
