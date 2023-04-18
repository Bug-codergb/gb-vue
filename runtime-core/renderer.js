const createRenderer = (options) => {
  const { createElement, insert, setElementText, unmount } = options;
  const render = (vnode, container) => {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else if (container._vnode) {//vnode不存在但是container._vnode存在
      container.innerHTML = "";
    }
    container._vnode = vnode;
  };

  const patch = (n1, n2, container) => {
    if (n1 && n1.type !== n2.type) {
      unmount(n1);
      n1 = null;
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
  const patchElement = (n1,n2) => {
    const el = n2.el = n1.el;//设置el为n1的el
    const oldProps = n1.props;
    const newProps = n2.props;
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
         patchProps(el,key,oldProps[key],newProps[key]); 
      }
    }
    for (const key in oldProps) {
      if (!key in newProps) {
        patchProps(el, key, oldProps[key], null);
      }
    }
    patchChild(n1,n2,el);
  }
  const patchChild = (n1,n2,el) => {
    if (typeof n2.children === "string") {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        })
      }
      setElementText(el, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (Array.isArray(n1.children)) {
        //diff算法
        // n1.children.forEach((child) => {
        //   unmount(child);
        // })
        // n2.children.forEach((child) => {
        //   patch(null,child,el);
        // })
        for (let i = 0; i < n1.children; i++){
          patch(n1.children[i],n2.children[i]);  
        }
        
      } else {
        setElementText(el, "");
        n2.children.forEach((child) => {
          patch(null, child, el);
        })
      }
    } else {
      //新节点为空
      if (typeof n1.children==="string") {
        el.setElementText(el,"")
      } else if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        })
      }
    }
  }
  //mount
  const mountElement = (vnode, container) => {
    const { type, children } = vnode;
    const el = createElement(type);
    vnode.el = el;
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
