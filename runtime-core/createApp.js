import { effect } from "../reactivity/effect.js";
import { createRenderer } from "./renderer.js";

//test

const createApp = (rootComponent) => {
  const { render } = createRenderer({
    createElement(type) {
      return document.createElement(type);
    },
    insert(container, children) {
      container.insertBefore(children,null);
    },
    setElementText(container, text) {
      container.textContent = text;
    },
    unmount(el) {
      const parent = el.parentNode;
      parent.removeChild(el);
    },
  });
  const context = rootComponent.setup()
  let body = document.body;
  return {
    mount(container) {
      effect(() => {
        body.innerHTML = "";
        const vnode = rootComponent.render(context);
        render(vnode, container);
        body.appendChild(container);
      });
    },
  };
};
export {
  createApp
}