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
  Comment,
  Static,
  isSameVNodeType,
} from './vnode.js';
import { invokeDirectiveHook } from './directives.js';
import { PatchFlags } from '../../shared/src/patchFlags.js';

// diff
import {
  simpleDiff,
  doubleEndDiff,
  quickDiff,
} from './diff.js';

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
    insert: hostInsert,
    setScopeId: hostSetScopeId,
    setText: hostSetText,
    createText: hostCreateText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    insertStaticContent: hostInsertStaticContent,
    createComment: hostCreateComment,
  } = options;// 这些方法由runtime-dom传入

  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
      return getNextHostNode(vnode.component.subTree);
    }
    return hostNextSibling((vnode.anchor || vnode.el));
  };

  // 渲染器的核心方法，render，由createApp调用
  const render = (vnode, container) => {
    if (vnode === null) { // 说明要卸载
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
      }
    } else {
      // 挂载阶段
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  function patch(n1, n2, container, anchor, parentComponent) {
    if (n1 === n2) { // 相等则不比较
      return;
    }
    console.log(n2);
    // debugger;
    if (n1 && !isSameVNodeType(n1, n2)) { // 如果接节存在，但是n1,n2的类型不一致且key不一致
      unmount(n1, parentComponent, null, true);// 类型不一致则直接卸载n1,将n1置为null，开始挂载新节点
      n1 = null;
    }

    const { type, ref, shapeFlag } = n2;
    // shapeFlag是什么时候生成的呢？其实是在编译节点形成createVNode的调用，在函数createVNode中形成，

    switch (type) {
      case Text:// 处理文本节点
        processText(n1, n2, container, anchor); break;
      case Comment:// 注释节点
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStatic(n2, container, anchor); break;
        } break;
      case Fragment:// 处理fragment，什么时候需要fragment，如存在于template上的v-if，
        processFragment(
          n1,
          n2,
          container,
          anchor,
          parentComponent,
        ); break;
      default:// 可以着重关注元素和组件的渲染
        if (shapeFlag & ShapeFlags.ELEMENT) { // 按位与，通过位运算记录元素类型的方法，在其他模块也比较常见，patchFlag,
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
  // 处理注释节点
  const processCommentNode = (
    n1,
    n2,
    container,
    anchor,
  ) => {
    if (n1 == null) {
      hostInsert(
        (n2.el = hostCreateComment((n2.children) || '')),
        container,
        anchor,
      );
    } else {
      // there's no support for dynamic comments
      n2.el = n1.el;
    }
  };
  // 处理fragment
  function processFragment(
    n1,
    n2,
    container,
    anchor,
    parentComponent,
  ) {
    // 挂载阶段会在一系列节点的最前面和最后面添加一个文本节点（‘’）
    const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
    const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));

    const { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;

    if (n1 == null) { // 挂载阶段
      hostInsert(fragmentStartAnchor, container, anchor);// 将fragmentStartAnchor添加在container中
      hostInsert(fragmentEndAnchor, container, anchor);// fragmentEndAnchor, container, anchor
      mountChildren(
        n2.children,
        container,
        fragmentEndAnchor, // 将每一个节点添加在fragmentEndAnchor，这样就形成了 ‘’ li,li,li,li,li ‘’
        parentComponent,
      );
    } else {
      patchChildren(// 对比children
        n1,
        n2,
        container,
        fragmentEndAnchor,
        parentComponent,
      );
    }
  }
  function processElement(n1, n2, container, anchor, parentComponent) {
    if (!n1) { // 挂载
      mountElement(n2, container, anchor, parentComponent);
    } else { // 更新
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
    /*
      dir是什么时候形成的呢？其实是在编译节点判断节点是否存在v-xx ,
      存在则通过withDirectives包裹(其实就是将指令相关属性(arg,exp,modifiers)  )添加至vnode上面
    */
    const {
      shapeFlag, type, props, dirs,
    } = vnode;
    const el = vnode.el = hostCreateElement(type, props && props.is, props);// 创建节点，并将其真实dom赋值
    // 文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 字节点为 数组节点
      mountChildren(vnode.children, el, null, parentComponent);
    }

    if (dirs) {
      /*
        判断其虚拟节点上是否存在dirs属性，该节点如果存在指令，则在编译阶段会通过withDirectives包裹，
        然后在渲染阶段在该虚拟节点上添加dirs属性，dir为一个对象，每个对象存在不同生命周期
        在这里调用created阶段的逻辑
       */
      invokeDirectiveHook(vnode, null, parentComponent, 'created');
    }

    if (props) {
      for (const key in props) {
        if (key !== 'value' && !isReservedProps(key)) { // 除了key,ref其他props需要处理
          const nextVal = props[key];
          hostPatchProp(el, key, null, nextVal);
        }
      }
      if ('value' in props) {
        hostPatchProp(el, 'value', null, props.value);
      }
    }
    // 调用指令的渲染前生命周期
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
    }
    hostInsert(el, container, anchor);// 将元素插入到dom中，渲染完毕

    if (dirs) { // 调用指令的dom渲染完毕的生命周期
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
    const el = n2.el = n1.el;// 这里注意将旧节点的n1对应的真实dom赋值给n2对应的真实dom
    const { patchFlag, dirs, dynamicChildren } = n2;
    // dynamicChilsden是在编译阶段生成openBlock,createELementBlock等api，在生成虚拟dom树时形成block节点list

    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};

    if (dirs) { // 同样调用元素更新时指令的更新前生命周期
      invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
    }
    if (patchFlag > 0) { // 如果patchFlag大于0则直接进行靶向更新
      if (patchFlag & PatchFlags.FULL_PROPS) {
      // full_props则表明它的key是动态的(v-bind="{ id: someProp, 'other-attr': otherProp }"，v-bind:[key])
        patchProps(
          el,
          n2,
          oldProps,
          newProps,
          parentComponent,
        );
      } else {
        // 只对比class
        if (patchFlag & PatchFlags.CLASS) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, 'class', null, newProps.class);
          }
        }
        // 只对比style
        if (patchFlag & PatchFlags.STYLE) {
          hostPatchProp(el, 'style', oldProps.style, newProps.style);
        }
      }
      if (patchFlag & PatchFlags.TEXT) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    }
    patchProps(el, n2, oldProps, newProps, parentComponent);
    patchChildren(n1, n2, el, anchor, parentComponent);
    if (dirs) {
      queuePostRenderEffect(() => { // dom上指令的mounted和uodated都是在异步队列里面的
        dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
      });
    }
  }

  function patchChildren(n1, n2, container, anchor, parentComponent) {
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
          unmount(c, null, null, true);
        });
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else { // 新节点的字节点是array || null
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 新节点是字节点是数组
          patchKeyedChildren(c1, c2, container, anchor, parentComponent, unmount);
        } else { // 新节点是null 旧节点是array
          c1.forEach((c) => {
            unmount(c, null, null, true);
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
  // 在这里分别调用不同的diff算法
  function patchKeyedChildren(c1, c2, container, anchor, parentComponent) {
    console.log(c1, c2);
    // simpleDiff(c1, c2, container, anchor, patch, unmount, hostInsert);
    // doubleEndDiff(c1, c2, container, anchor, patch, unmount, hostInsert);
    quickDiff(c1, c2, container, anchor, patch, unmount, hostInsert);
  }
  function patchUnKeyedChildren(c1, c2, container, anchor, parentComponent) {

  }
  // 组件
  function processComponent(n1, n2, container, parentComponent) {
    if (n1 === null) { // 挂载组件
      mountComponent(n2, container, parentComponent);
    } else { // 更新组件
      console.log(n1, n2);
      updateComponent(n1, n2, container, parentComponent);
    }
  }
  // 渲染组件，创建一个组件实例，将组件实例添加至虚拟节点上。
  function mountComponent(initialVNode, container, anchor, parentComponent) {
    const instance = createComponentInstance(initialVNode, container);// 创建一个组件实例
    initialVNode.component = instance;//

    setupComponent(instance);// 设置setup相关

    setupRenderEffect(instance, initialVNode, container);
  }
  function updateComponent(n1, n2, container, parentComponent) {

  }

  function setupRenderEffect(instance, initialVNode, container, anchor) {
    const componentUpdateFn = () => {
      console.log('副作用函数');
      if (!instance.isMounted) {
        const { el, props } = initialVNode;
        const { bm, m, parent } = instance;// 获取当前实例上的bm(beforeMount),m(mounted)
        // console.log(instance);
        if (bm) {
          invokArrayFns(bm);// 调用生命周期钩子，同一个生命周期可能存在多个钩子
        }
        const subTree = (instance.subTree = renderComponentRoot(instance));

        console.log(subTree);
        patch(
          null,
          subTree,
          container,
          anchor,
          instance,
        );
        initialVNode.el = subTree.el;
        if (m) {
          queuePostRenderEffect(m);// 调用渲染完毕生命周期，异步后置队列
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

        // console.log(prevTree, nextTree);
        patch(
          prevTree,
          nextTree,
          hostParentNode(prevTree.el),
          getNextHostNode(prevTree),
          instance,
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

  function unmount(
    vnode,
    parentComponent,
    parentSuspense,
    doRemove = false,
  ) {
    const {
      type,
      props,
      ref,
      children,
      dynamicChildren,
      shapeFlag,
      patchFlag,
      dirs,
    } = vnode;

    if (
      (type === Fragment
    /* && patchFlag & (PatchFlags.KEYED_FRAGMENT | PatchFlags.UNKEYED_FRAGMENT) */)
    ) {
      unmountChildren(children, null, null, true);
    }
    if (doRemove) {
      remove(vnode);
    }
  }
  function unmountChildren(
    children,
    parentComponent,
    parentSuspense,
    doRemove = false,
    optimized = false,
    start = 0,
  ) {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  }
  function remove(vnode) {
    const {
      type, el, anchor,
    } = vnode;
    if (type === Fragment) {
      removeFragment(el, anchor);
      return;
    }
    hostRemove(el);
  }
  function removeFragment(cur, end) {
    // For fragments, directly remove all contained DOM nodes.
    // (fragment child nodes cannot have transition)
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  }
  return {
    render,
    createApp: createAppAPI(render),
  };
}
export {
  createRenderer,
};
