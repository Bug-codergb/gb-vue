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
  const vnode = rootComponent.render(rootComponent.setup());
  console.log(vnode);
  let body = document.body;
  return {
    mount(container) {
      effect(() => {
        console.log(121212121)
        body.innerText = "";
        render(vnode, container);
        body.appendChild(container);
      });
    },
  };
};
export {
  createApp
}