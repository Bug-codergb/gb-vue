import ShapeFlags from '../../shared/src/shapeFlags.js';
import { setCurrentRenderingInstance} from "./componentRenderContext.js";
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
  setCurrentRenderingInstance(instance);
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    const proxyToUse = setupState;// proxy;
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
  console.log(result);
  return result;
}
