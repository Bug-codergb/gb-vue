import { reactive } from "../reactivity/reactive.js";
import { effect } from "../reactivity/effect.js";

const queue = new Set();
let isFlushing = false;
const p = Promise.resolve();
function queueJob(job) {
  queue.add(job);
  if (!isFlushing) {
    isFlushing = true;
    p.then(() => {
      try {
        queue.forEach((job) => job());
      } finally {
        isFlushing = false;
      }
    });
  }
}

const createRenderer = (options) => {
  const { createElement, insert, setElementText, unmount } = options;
  const render = (vnode, container) => {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else if (container._vnode) {
      //vnode不存在但是container._vnode存在
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
        patchElement(n1, n2, container);
      }
    } else if (typeof type === "object") {
      if (!n1) {
        mountComponent(n2, container);
      } else {
        patchComponent(n1, n2, anchor);
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
    } else if (key === "class") {
      el.className = nextValue;
    } else if (shouldSetAsProps(el, key, nextValue)) {
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
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el); //设置el为n1的el
    const oldProps = n1.props;
    const newProps = n2.props;
    for (const key in newProps) {
      if (newProps[key] !== oldProps[key]) {
        patchProps(el, key, oldProps[key], newProps[key]);
      }
    }
    for (const key in oldProps) {
      if (!key in newProps) {
        patchProps(el, key, oldProps[key], null);
      }
    }
    patchChild(n1, n2, el);
  };
  const patchChild = (n1, n2, el) => {
    if (typeof n2.children === "string") {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        });
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

        /*const n1Len = n1.children.length;
        const n2Len = n2.children.length;
        const commonLen = Math.min(n1Len, n2Len);
        for (let i = 0; i < commonLen; i++){
          patch(n1.children[i],n2.children[i]);  
        }
        if (n1Len > commonLen) {
          for (let i = commonLen; i < n1.length; i++){
            unmount(n1.children[i]);
          }
        }
        if (n2Len > commonLen) {
          for (let i = commonLen; i < n2.length; i++){
            unmount(n2.children[i]);
          }
        }*/
        const oldChildren = n1.children;
        const newChildren = n2.children;
        let lastIndex = 0;
        for (let i = 0; i < oldChildren.length; i++) {
          let oldChild = oldChildren[i];
          for (let j = 0; j < newChildren.length; j++) {
            let newChild = newChildren[j];
            if (oldChild.key === newChild.key) {
              patch(oldChild, newChild, container);

              if (j < lastIndex) {
              } else {
                lastIndex = j;
              }
              break;
            }
          }
        }
      } else {
        setElementText(el, "");
        n2.children.forEach((child) => {
          patch(null, child, el);
        });
      }
    } else {
      //新节点为空
      if (typeof n1.children === "string") {
        el.setElementText(el, "");
      } else if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        });
      }
    }
  };
  const patchComponent = (n1,n2,container,anchor) => {
    const instance = (n2.component = n1.component);
    const { props } = instance;
    if (hasPropsChanged(n1.props, n2.props)) {
      const [nextProps] = resolveProps(n2.type.props, n2.props);
      for (const k in nextProps) {
        props[k] = nextProps[k]
      }
      for (const k in props) {
        if (!(k in nextProps)) {
          delete props[key];
        }
      }
    }
   }
  //mount
  const mountElement = (vnode, container) => {
    const { type, children } = vnode;
    const el = createElement(type);
    vnode.el = el;
    if (
      (children && typeof children === "string") ||
      typeof children === "number"
    ) {
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
  const mountComponent = (vnode, container, anchor) => {
    const componentOptions = vnode.type;
    const {
      render,
      data,
      beforeCreate,
      created,
      beforeMount,
      mounted,
      beforeUpdate,
      updated,
      props:propsOptions
    } = componentOptions;

    beforeCreate && beforeCreate();

    const state = reactive(data());

    const [props, attrs] = resolveProps(propsOptions,vnode.props);

    const instance = {
      state,
      isMounted: false,
      subTree: null,
    };
    vnode.component = instance;
    const renderProxy = new Proxy(instance, {
      get(target,key,receiver) {
        const { state, props } = target;
        if (state && key in state) {
          return state[key];
        } else if (key in props) {
          return props[key];
        } else {
          console.log(`不存在`)
        }
      },
      set(target,key,value,receiver) {
        const { state, props } = target;
        if (state && key in state){
          state[key] = value;
        } else if (key in props) {
          console.warn("props是只读的")
        } else {
          console.log("不存在");
        }
      }
    })
    created && created.call(renderProxy);

    effect(
      () => {
        const subTree = render.call(state, state);

        if (!instance.isMounted) {
          beforeMount && beforeMount.call(renderProxy);
          patch(null, subTree, container, anchor);
          instance.isMounted = true;
          mounted && mounted.call(renderProxy);
        } else {
          beforeUpdate && beforeUpdate.call(renderProxy);

          patch(instance.subTree, subTree, container, anchor);

          updated && updated.call(renderProxy);
        }

        instance.subTree = subTree;
      },
      {
        scheduler: queueJob,
      }
    );
  };
  const resolveProps = (propsOptions,vnodeProps) => {
    const props = {};
    const attrs = {};
    for (let key in vnodeProps) {
      if (key in propsOptions) {
        props[key] = propsOptions[key]
      } else {
        attrs[key] = vnodeProps[key];
      }
    }
    return [props, attrs];
  }
  const hasPropsChanged = (prevProps,nextProps) => {
    const prevPropsKey = Object.keys(prevProps);
    const nextPropsKey = Object.keys(nextProps);
    if (prevPropsKey.length !== nextPropsKey.length) {
      return true;
    }
    for (let key in nextProps) {
      if (prevProps[key] !== nextProps[key]) {
        return true;
      }
    }
    return false;
  }
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
