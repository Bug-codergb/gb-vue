import { patchProp } from "./patchProp.js";
import { nodeOps } from "./nodeOp.js";
import { createRenderer } from "../../runtime-core/src/renderer.js";
import { isString } from "../../shared/src/general.js";
const renderOptions = Object.assign({ patchProp }, nodeOps);

let renderer;
function ensureRenderer() {
  return renderer || (renderer = createRenderer(renderOptions));
}
export const render = ((...args) => {
  ensureRenderer().render(args);
})
export const createApp = ((...args) => {
  const app = ensureRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    console.log(container)
    if (!container) return;
    const component = app._component;
    container.innerHTML = "";
    const proxy = mount(container);
    return proxy;
  }
  return app;
});
function normalizeContainer(container) {
  if (isString(container)) {
    const res = document.querySelector(container) || document.getElementById(container);
    return res;
  }
  return container;
}
export {
  registerRuntimeCompiler
} from "../../runtime-core/src/index.js";