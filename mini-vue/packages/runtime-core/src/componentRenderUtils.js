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
  console.log(proxy, proxy.appProp);
  console.log(render);
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    const proxyToUse = proxy;
    result = render.call(
      proxyToUse,
      proxyToUse,
      renderCache,
      props,
      setupState,
      data,
      ctx,
    );
  }
  console.log(result  );
  return result;
}
