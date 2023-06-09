import { reactive } from "../reactivity/reactive.js";
import { effect } from "../reactivity/effect.js";
const createRenderer = (options) => {
  const { unmount, createElement, remove, setElementText, insert } = options;
  const render = (vnode, container) => {
    /*
      如果vnode不存在但是container._vnode存在则是卸载操作
    */
    if (!vnode && container._vnode) {
      unmount(container._vnode);
    } else if (vnode) {
      patch(container._vnode, vnode, container, null);
    }
    container._vnode = vnode;
  };
  /* n1为旧节点，n2为新节点节点 */
  const patch = (n1, n2, container, anchor) => {
    const { type } = n2;
    if (n1 && n1.type !== type) {
      unmount(n1);
      n1 = null;
    }
    if (typeof type === "string") {
      if (!n1) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2, container);
      }
    } else if (typeof type === "object") {
      if (!n1) {
        mountComponent(n2, container);
      } else {
        patchComponent(n1, n2, container);
      }
    }
  };
  const mountElement = (n2, container, anchor) => {
    const { type, children, props } = n2;
    const el = createElement(type);
    n2.el = el;
    const childrenType = typeof children;
    if (childrenType === "string") {
      setElementText(n2.el, children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        patch(null, child, el);
      });
    }
    if (props && Object.keys(props)) {
      for (let key of Object.keys(props)) {
        const value = props[key];
        patchProps(el, key, null, value);
      }
    }
    insert(n2.el, container, anchor);
  };
  const patchProps = (el, key, prevValue, nextValue) => {
    if (/^on/.test(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, nextValue);
    } else if (key === "class") {
      el.className = nextValue;
    } else {
      const type = typeof el[key];
      if (type === "boolean") {
        if (nextValue === "") {
          el[key] = true;
        } else {
          el[key] = prevValue;
        }
      } else {
        el.setAttribute(key, nextValue);
      }
    }
  };
  const patchElement = (n1, n2, container) => {
    const el = (n2.el = n1.el);

    const oldProps = n1.props;
    const newProps = n2.props;

    for (let newKey in newProps) {
      if (newProps[newKey] !== oldProps[newKey]) {
        //找到新增的key
        patchProps(el, newKey, oldProps[newKey], newProps[newKey]);
      }
    }
    for (const oldKey in oldProps) {
      if (!newProps.hasOwnProperty(oldKey)) {
        //找到要删除的旧的key
        patchProps(el, oldKey, oldProps[oldKey], null);
      }
    }

    if (typeof n2.children === "string") {
      if (Array.isArray(n1.children)) {
        n1.children.forEach(child => {
          unmount(child);
        })
      }
      setElementText(el,n2.children);
    } else if (Array.isArray(n2.children)) {
      if (typeof n1.children === "string") {
        setElementText(el, "");
        n2.children.forEach((child) => {
          patch(null, child, el);
        });
      } else if (Array.isArray(n1.children)) {
        //diff
        const oldChildren = n1.children;
        const newChildren = n2.children;
        let lastIndex = 0;
        for (let i = 0; i < newChildren.length; i++) {
          const newChild = newChildren[i];
          let find = false;
          for (let j = 0; j < oldChildren.length; j++) {
            const oldChild = oldChildren[j];

            if (oldChild.key === newChild.key) {
              find = true;
              patch(oldChild, newChild, el);
              if (j < lastIndex) {
                const prevNode = newChildren[i - 1];
                if (prevNode) {
                  const anchor = prevNode.el.nextSibling;
                  insert(newChild.el, el, anchor);
                }
              } else {
                lastIndex = j;
              }
              break;
            }
          }
          if (!find) {
            //说明为新节点需要挂载
            const prevNode = newChildren[i - 1];
            let anchor = null;
            if (prevNode) {
              anchor = prevNode.el.nextSibling;
            } else {
              anchor = el.firstChild;
            }
            patch(null, newChild, el, anchor);
          }
        }

        for (let oldChild of oldChildren) {
          const has = newChildren.find((vnode) => {
            return vnode.key === oldChild.key;
          });
          if (!has) {
            unmount(oldChild);
          }
        }
      } else {
        //n1为null则直接挂载n2
        setElementText(el, "");
        n2.children.forEach((child) => {
          patch(null, child, el);
        });
      }
    } else {
      //新节点为null,
      if (typeof n1Type === "string") {
        setElementText(el, "");
      } else if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        });
      }
    }
  };

  const mountComponent = (n2, container) => {
    const componentOptions = n2.type;
    const { render, data, props: propsOptions, setup } = componentOptions;
    const state = reactive(data());
    //const vnode = render(state);
    const instance = {
      state,
      subTree: null,
      isMounted: false,
    };
    n2.component = instance;
    effect(() => {
      const subTree = render.call(state, state);
      if (!instance.isMounted) {
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        patch(instance.subTree, subTree, container);
      }
      instance.subTree = subTree;
    });
  };
  const patchComponent = (n1, n2, container) => {};
  return {
    render,
  };
};
export { createRenderer };
