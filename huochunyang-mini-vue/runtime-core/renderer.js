import { reactive } from '../reactivity/reactive.js';
import { effect } from '../reactivity/effect.js';

const createRenderer = (options) => {
  const {
    unmount, createElement, remove, setElementText, insert,
  } = options;
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
  const patch = (n1, n2, container, anchor = null) => {
    const { type } = n2;
    if (n1 && n1.type !== type) {
      unmount(n1);
      n1 = null;
    }
    if (typeof type === 'string') {
      if (!n1) {
        mountElement(n2, container, anchor);
      } else {
        patchElement(n1, n2, container);
      }
    } else if (typeof type === 'object') {
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
    if (childrenType === 'string') {
      setElementText(n2.el, children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        patch(null, child, el);
      });
    }
    if (props && Object.keys(props)) {
      for (const key of Object.keys(props)) {
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
    } else if (key === 'class') {
      el.className = nextValue;
    } else {
      const type = typeof el[key];
      if (type === 'boolean') {
        if (nextValue === '') {
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

    for (const newKey in newProps) {
      if (newProps[newKey] !== oldProps[newKey]) {
        // 找到新增的key
        patchProps(el, newKey, oldProps[newKey], newProps[newKey]);
      }
    }
    for (const oldKey in oldProps) {
      if (!newProps.hasOwnProperty(oldKey)) {
        // 找到要删除的旧的key
        patchProps(el, oldKey, oldProps[oldKey], null);
      }
    }

    if (typeof n2.children === 'string') {
      if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        });
      }
      setElementText(el, n2.children);
    } else if (Array.isArray(n2.children)) {
      if (typeof n1.children === 'string') {
        setElementText(el, '');
        n2.children.forEach((child) => {
          patch(null, child, el);
        });
      } else if (Array.isArray(n1.children)) {
        // diff
        const oldChildren = n1.children;
        const newChildren = n2.children;

        let j = 0;
        while (oldChildren[j].key === newChildren[j].key) {
          patch(oldChildren[j], newChildren[j], el);
          j++;
        }

        let newEndIndex = newChildren.length - 1;
        let oldEndIndex = oldChildren.length - 1;
        while (newChildren[newEndIndex].key === oldChildren[oldEndIndex].key) {
          patch(oldChildren[oldEndIndex], newChildren[newEndIndex], el);
          newEndIndex--;
          oldEndIndex--;
        }
        // 挂载新节点
        if (j > oldEndIndex && j <= newEndIndex) {
          const anchorIndex = newEndIndex + 1;
          const anchor = anchorIndex < newChildren.length
            ? newChildren[anchorIndex].el
            : null;
          while (j <= newEndIndex) {
            patch(null, newChildren[j], el, anchor);
          }
        }
        // 删除旧节点
        else if (j > newEndIndex && j <= oldEndIndex) {
          while (j <= oldEndIndex) {
            unmount(oldChildren[j]);
          }
        } else {
          const count = newEndIndex - j + 1;
          const source = new Array(count);
          source.fill(-1);

          const oldStartIndex = j;
          const newStartIndex = j;
          const keyIndex = {};
          let pos = 0;
          let moved = false;
          for (let i = newStartIndex; i <= newEndIndex; i++) {
            keyIndex[newChildren[i].key] = i;
          }
          console.log(keyIndex);
          let patched = 0;
          for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            const k = keyIndex[oldChildren[i].key];
            console.log(oldChildren[i].key, k);
            if (patched <= count) {
              if (typeof k !== 'undefined') {
                patch(oldChildren[i], newChildren[k], el);
                patched++;
                source[k - newStartIndex] = i;
                if (k < pos) {
                  moved = true;
                } else {
                  pos = k;
                }
              } else {
                unmount(oldChildren[i]);
              }
            } else {
              unmount(oldChildren[i]);
            }
          }
          if (moved) {
            console.log(source);
            const seq = getSequence(source);
            console.log(seq);
            let s = seq.length - 1;
            let i = count - 1;
            for (i; i >= 0; i--) {
              if (source[i] === -1) {
                const pos = i + newStartIndex;
                const newVNode = newChildren[pos];
                const nextPos = pos + 1;
                const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
                patch(null, newVNode, el, anchor);
              } else if (i !== seq[s]) {
                const pos = i + newStartIndex;
                const newVNode = newChildren[pos];
                const nextPos = pos + 1;
                const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
                insert(newVNode.el, el, anchor);
              } else {
                s--;
              }
            }
          }
        }
      } else {
        // n1为null则直接挂载n2
        setElementText(el, '');
        n2.children.forEach((child) => {
          patch(null, child, el);
        });
      }
    } else {
      // 新节点为null,
      if (typeof n1Type === 'string') {
        setElementText(el, '');
      } else if (Array.isArray(n1.children)) {
        n1.children.forEach((child) => {
          unmount(child);
        });
      }
    }
  };
  /*
    resolveProps 接受2个参数
    options：组件定义的props选项
    propsData: 用户传入组件的props的具体数据
  */
  const resolveProps = (options, propsData) => {
    const props = {};
    const attrs = {};
    for (const key in propsData) {
      if (options.hasOwnProperty(key)) {
        props[key] = propsData[key];
      } else {
        attrs[key] = propsData[key];
      }
    }
    return [props, attrs];
  };
  const mountComponent = (n2, container) => {
    const vnode = n2;
    const componentOptions = vnode.type;
    let {
      render, data, props: propsOptions, setup, created,
    } = componentOptions;

    const [props, attrs] = resolveProps(propsOptions, vnode.props);

    const state = reactive(data());
    const instance = {
      state,
      subTree: null,
      isMounted: false,
      props,
    };
    n2.component = instance;
    const setupContext = { attrs };
    let setupState = null;
    const setupResult = setup(props, setupContext);
    if (typeof setupResult === 'function') {
      render = setupResult;
    } else {
      setupState = setupResult;
    }
    const renderContext = new Proxy(instance, {
      // 直接通过instance.key访问state或者props;
      get(target, key, receiver) {
        const { props, state } = target;
        if (state && key in state) {
          return state[key];
        }
        if (props && key in props) {
          return props[key];
        }
        if (setupState && key in setupState) {
          return setupState[key];
        }
      },
      set(target, key, value, receiver) {
        const { props, state } = target;
        if (state && key in state) {
          state[key] = value;
        }
        if (props && key in props) {
          console.warn('pops is readonly');
        }
        if (setupState && key in setupState) {
          setupState[key] = value;
        }
      },
    });
    created && created.call(renderContext);// 或者其他生命周期
    effect(() => {
      const subTree = render.call(renderContext, renderContext);
      if (!instance.isMounted) {
        patch(null, subTree, container);
        instance.isMounted = true;
      } else {
        patch(instance.subTree, subTree, container);
      }
      instance.subTree = subTree;
    }, {});
  };
  const hasChangeProps = (oldProps, newProps) => {
    if (Object.keys(oldProps).length !== Object.keys(newProps).length) {
      return true;
    }
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        return true;
      }
    }
    return false;
  };
  const patchComponent = (n1, n2, container) => {
    const instance = n2.component = n1.component;
    const { props } = instance;
    if (hasChangeProps(n1.props, n2.props)) {
      const [newProps] = resolveProps(n2.type.props, n2.props);
      for (const k in newProps) { // 更新到最新值;
        props[k] = newProps[k];
      }
      for (const k in props) { // 删除旧值
        if (!(k in newProps)) {
          delete props[k];
        }
      }
    }
  };
  return {
    render,
  };
};

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i; let j; let u; let v; let
    c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = ((u + v) / 2) | 0;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
export { createRenderer };
