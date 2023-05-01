import { effect } from "../reactivity/effect.js";
import { createRenderer } from "./renderer.js";

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
  const context = rootComponent.setup()
  
  let body = document.body;
  return {
    mount(container) {
      effect(() => {
        const vnode = rootComponent.render(context);
        render(vnode, container);
      });
    },
  };
};
export {
  createApp
}