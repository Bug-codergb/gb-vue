const createRenderer = (options) => {
  const { createElement, insert, setElementText, unmount } = options;
  const render = (vnode, container) => {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else if (container._vnode) {
      container.innerHTML = "";
    }
  };

  const patch = (n1, n2, container) => {
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
      debugger
    }
    const { type } = n2;
    if (typeof type === "string") {
      if (!n1) {
        mountElement(n2, container);
      } else {
        patchElement(n1,n2,container);
      }
    } else if (typeof type === "object") {
      if (!n1) {
        mountElement(n2, container);
      } else {
      }
    } else {
    }
  };
  const shouldSetAsProps = (el, key, value) => {
    if (key === "form" && el.tagName === "INPUT") {
      return false;
    }
    return key in el;
  };
  //patch
  const patchProps = (el, key, prevValue, nextValue) => {
    if (/^on/.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, nextValue);
    }else if (key === "class") {
      el.className = nextValue;
    }else if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];
      if (type === "boolean" && value === "") {
        el[key] = true;
      } else {
        el[key] = value;
      }
    } else {
      el.setAttribute(key, vnode.props[key]);
    }
  };
  //mount
  const mountElement = (vnode, container) => {
    const { type, children } = vnode;
    const el = createElement(type);
    if (children && typeof children === "string" || typeof children === "number") {
      setElementText(el, children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        patch(null, child, el);
      });
    }

    if (vnode.props && Object.keys(vnode.props).length !== 0) {
      const keys = Object.keys(vnode.props);
      for (let key of keys) {
        const value = vnode.props[key];
        patchProps(el, key, null, value);
      }
    }
    insert(container, el);
  };
  return {
    render,
  };
};

//test
// createRenderer({
//   createElement(type) {
//     document.createElement(type);
//   },
//   insert(container, children) {
//     container.appendChild(children);
//   },
//   setElementText(container, text) {
//     container.textContent = text;
//   },
//   unmount(el) {
//     const parent = el.parentNode;
//     parent.removeChild(el);
//   },
// });
export { createRenderer };
