import { effect } from "../reactivity/effect.js";
import { createRenderer} from "./renderer.js";
import { h } from "./h.js";

const createApp = (rootComponent) => {
  const { render } = createRenderer({
    createElement(type) {
      return document.createElement(type);
    },
    insert(children, parent, anchor) {
      parent.insertBefore(children,anchor);
    },
    setElementText(container, text) {
      container.textContent = text;
    },
    unmount(vnode) {
      const parent = vnode.el.parentNode;
      parent.removeChild(vnode.el);
    },
  });
  return {
    mount(container) {
      const vnode = h(rootComponent,{});
      render(vnode, container);
    },
  };
};
export {
  createApp
}