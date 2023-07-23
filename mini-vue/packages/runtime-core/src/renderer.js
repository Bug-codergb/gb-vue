import { createAppAPI } from './apiCreateApp.js';
import { ReactiveEffect } from '../../reactivity/src/effect.js';
import { invokArrayFns, isReservedProps } from '../../shared/src/general.js';
import ShapeFlags from '../../shared/src/shapeFlags.js';
import { queueJob, queuePostFlushCb } from './scheduler.js';
import {
  createComponentInstance,
  setupComponent,
} from './component.js';
import {
  renderComponentRoot,
} from './componentRenderUtils.js';
import {
  Text,
  Fragment,
  Static,
  isSameVNodeType,
} from './vnode.js';
import { invokeDirectiveHook } from './directives.js';
import { PatchFlags } from '../../shared/src/patchFlags.js';

export const queuePostRenderEffect = queuePostFlushCb;

function createRenderer(rendererOptions) {
  return baseCreateRenderer(rendererOptions);
}

function baseCreateRenderer(options) {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    remove: hostRemove,
    unmount,
    insert: hostInsert,
    setScopeId: hostSetScopeId,
    setText: hostSetText,
    createText: hostCreateText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    insertStaticContent: hostInsertStaticContent,
  } = options;
  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };
  function patch(n1, n2, container, anchor, parentComponent) {
    if (n1 === n2) { // 相等则不比较
      return;
    }

    if (n1 && !isSameVNodeType(n1, n2)) { // 如果接节存在，但是n1,n2的类型不一致且key不一致
      unmount(n1);
      n1 = null;
    }

    const { type, ref, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor); break;
      case Static:
        if (n1 == null) {
          mountStatic(n2, container, anchor); break;
        } break;
      case Fragment:
        processFragment(n1, n2, container); break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          console.log('更新组件');
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }
  // 处理文本节点
  function processText(n1, n2, container, anchor) {
    if (n1 === null) { // 挂载阶段
      const text = n2.children;
      n2.el = hostCreateText(text);
      hostInsert(n2.el, container, anchor);// 直接将n2插入
    } else {
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  }
  function processElement(n1, n2, container, anchor, parentComponent) {
    if (!n1) {
      mountElement(n2, container, anchor, parentComponent);
    } else {
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  }
  // patchProps
  function patchProps(el, vnode, oldProps, newProps, parentComponent) {
    if (oldProps !== newProps) {
      if (Object.keys(oldProps).length !== 0) {
        for (const key in oldProps) {
          if (!isReservedProps(key) && !(key in newProps)) { // 删除旧的key
            hostPatchProp(el, key, oldProps[key], null, vnode.children, parentComponent);
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProps(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== 'value') {
          hostPatchProp(el, key, prev, next, vnode.children, parentComponent);
        }
      }
    }
  }
  // element -> mount
  function mountElement(vnode, container, anchor, parentComponent) {
    const {
      shapeFlag, type, props, dirs,
    } = vnode;
    const el = vnode.el = hostCreateElement(type, props && props.is, props);
    // 文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 数组节点
      mountChildren(vnode.children, el, null, parentComponent);
    }

    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, 'created');
    }

    if (props) {
      for (const key in props) {
        if (key !== 'value' && !isReservedProps(key)) {
          const nextVal = props[key];
          hostPatchProp(el, key, null, nextVal);
        }
      }
      if ('value' in props) {
        hostPatchProp(el, 'value', null, props.value);
      }
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
    }
    hostInsert(el, container, anchor);

    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
    }
  }
  function mountChildren(children, container, anchor, parentComponent) {
    children.forEach((child) => {
      patch(null, child, container, anchor, parentComponent);
    });
  }
  // element -> update
  function updateElement(n1, n2, container, anchor, parentComponent) {
    console.log(n1, n2);
    const el = n2.el = n1.el;
    const { patchFlag, dirs } = n2;

    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};

    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
    }
    if (patchFlag > 0) {
      if (patchFlag & PatchFlags.TEXT) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    }
    patchProps(el, n2, oldProps, newProps, parentComponent);
    patchChildren(n1, n2, el, anchor, parentComponent);
    if (dirs) {
      queuePostRenderEffect(() => {
        dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
      });
    }
  }

  function patchChildren(n1, n2, container, anchor, parentComponent) {
    console.log(n1, n2, container);
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, patchFlag, children: c2 } = n2;

    if (patchFlag > 0) {
      if (patchFlag & PatchFlags.KEYED_FRAGMENT) {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent);
      }
      return;
    } if (patchFlag & PatchFlags.UNKEYED_FRAGMENT) {
      patchUnKeyedChildren(c1, c2, container, anchor, parentComponent);
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // 新节点是文本节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 旧节点的字节点是数组，新节点的字节点是文本
        c1.forEach((c) => {
          unmount(c);
        });
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else { // 新节点的字节点是array || null
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 新节点是字节点是数组
          patchKeyedChildren(c1, c2, container, anchor, parentComponent);
        } else { // 新节点是null 旧节点是array
          c1.forEach((c) => {
            unmount(c);
          });
        }
      } else { // 旧节点的字节点是text ｜｜ null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 旧节点的字节点是文本
          hostSetElementText(container, '');
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 新节点是array
          c2.forEach((c) => {
            patch(null, c, container, anchor, parentComponent);
          });
        }
      }
    }
  }
  function patchKeyedChildren(c1, c2, container, anchor, parentComponent) {
    console.log(c1, c2);
    let i = 0;
    const l2 = c2.length;
    const e1 = c1.length - 1;
    const e2 = l2 - 1;

    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent);
      } else {
        break;
      }
      i++;
    }
  }
  function patchUnKeyedChildren(c1, c2, container, anchor, parentComponent) {

  }
  // 组件
  function processComponent(n1, n2, container, parentComponent) {
    if (n1 === null) {
      mountComponent(n2, container, parentComponent);
    } else {
      console.log(n1, n2);
      updateComponent(n1, n2, container, parentComponent);
    }
  }
  function mountComponent(initialVNode, container, anchor, parentComponent) {
    const instance = createComponentInstance(initialVNode, container);
    initialVNode.component = instance;

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }
  function updateComponent(n1, n2, container, parentComponent) {

  }
  function setupRenderEffect(instance, initialVNode, container, anchor) {
    const componentUpdateFn = () => {
      console.log('副作用函数');
      if (!instance.isMounted) {
        const { el, props } = initialVNode;
        const { bm, m, parent } = instance;
        console.log(instance);
        if (bm) {
          invokArrayFns(bm);
        }
        const subTree = (instance.subTree = renderComponentRoot(instance));
        // console.log(subTree);
        patch(
          null,
          subTree,
          container,
          anchor,
          instance,
        );
        initialVNode.el = subTree.el;
        if (m) {
          queuePostRenderEffect(m);
        }
        instance.isMounted = true;
        initialVNode = container = anchor = null;
      } else {
        let {
          next, bu, u, parent, vnode,
        } = instance;
        const originNext = next;
        if (next) {
          next.el = vnode.el;
        } else {
          next = vnode;
        }
        if (bu) {
          invokArrayFns(bu);
        }
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        console.log(prevTree, nextTree);
        patch(
          prevTree,
          nextTree,

        );
        if (u) {
          queuePostRenderEffect(u);
        }
      }
    };
    const effect = (instance.effect = new ReactiveEffect(
      componentUpdateFn,
      () => queueJob(update),
    ));
    const update = (instance.update = () => effect.run());
    update.id = instance.uid;

    update();
  }
  return {
    render,
    createApp: createAppAPI(render),
  };
}
export {
  createRenderer,
};
