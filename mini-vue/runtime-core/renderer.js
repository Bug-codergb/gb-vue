import { effect } from "../reactivity/effect.js";
import { isReservedProps } from "../shared/src/general.js";
import ShapeFlags from "../shared/src/shapeFlags.js";
import {
  createComponentInstance,
  setupComponent
} from "./component.js"
import {
  Text,
  Fragment
} from "./vnode.js";
const createRenderer = (options) => {
  const {
    createElement,
    setElementText:hostSetElementText,
    patchProps:hostPatchProps,
    remove,
    insert:hostInsert,
    createText: hostCreateText,
    unmount
  } = options;
  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode);
      }
    } else {
      patch(null, vnode, container);
    }
    container._vnode = vnode;
  }
  function patch(n1,n2,container,anchor,parentComponent){
    const { type,shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container); break;
      case Fragment:
        processFragment(n1, n2, container); break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2,container,anchor,parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }
  //处理文本节点
  function processText(n1,n2,container) {
    if (n1 === null) { //挂载阶段
      const text = n2.children;
      n2.el = hostCreateText(text);
      hostInsert(n2.el,container);//直接将n2插入
    }
  }
  function processElement(n1,n2,container,anchor,parentComponent) {
    if (!n1) {
      mountElement(n2, container, anchor);
    } else {
      updateElement(n1,n2,container,anchor,parentComponent);
    }
  }
  //patchProps
  function patchProps(el, vnode, oldProps, newProps, parentComponent) {
    if (oldProps !== newProps) {
      if (Object.keys(oldProps).length!==0) {
        for (key in oldProps) {
          if (!isReservedProps(key) && !(key in newProps)) { //删除旧的key
            hostPatchProps(el,key,oldProps[key],null,vnode.children,parentComponent);
          }
        }
      }
      for (const key in newProps) {
        if (isReservedProps(key)) continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== 'value') {
          hostPatchProps(el, key, prev, next, vnode.children, parentComponent);
        }
      }
    }
  }
  // element -> mount
  function mountElement(vnode,container,anchor){
    const { shapeFlag, type, props } = vnode;
    const el = createElement(type);
    //文本节点
    if (shapeFlag && ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el,vnode.children);
    } else if (shapeFlag && ShapeFlags.ARRAY_CHILDREN) {//数组节点
      mountChildren(vnode.children,el);
    }
    if (props) {
      for (const key in props) {
        const nextVal = props[key];
        hostPatchProps(el,key,null,nextVal);
      }
    }
    insert(el,container,anchor);
  }
  function mountChildren(children,container) {
    children.forEach((child) => {
      patch(null, child, container);
    })
  }
  //element -> update
  function updateElement(n1,n2,container,anchor,parentComponent) {
    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};
    const el = n2.el = n1.el;
    patchProps(el,n2, oldProps, newProps,parentComponent);
    patchChildren(n1,n2,el,anchor,parentComponent);
  }
  function patchChildren(n1,n2,container,anchor,parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { //新节点是文本节点
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 旧节点的字节点是数组，新节点的字节点是文本
        c1.forEach((c) => {
          unmount(c);
        })
      }
      if (c1 !== c2) {
        hostSetElementText(container,c2);
      }
    } else {//新节点的字节点是array || null
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) { //新节点是字节点是数组
          patchKeyedChildren(c1, c2, container, anchor, parentComponent);
        } else { //新节点是null 旧节点是array
          c1.forEach((c) => {
            unmount(c);
          })
        }
      } else { // 旧节点的字节点是text ｜｜ null
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) { //旧节点的字节点是文本
          hostSetElementText(container, "");
        } 
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {//新节点是array
          c2.forEach((c) => {
            patch(null,c,container,anchor,parentComponent);
          })
        }
      }
    }
  }
  function patchKeyedChildren(c1,c2,container,anchor,parentComponent) {
    
  }
  //组件
  function processComponent(n1,n2,container,parentComponent) {
    if (n1 === null) {
      mountComponent(n2,container,parentComponent);
    } else {
      updateComponent(n1, n2, container, parentComponent);
    }
  }
  function mountComponent(vnode,container,parentComponent) {
    const instance = createComponentInstance(vnode, container);
    vnode.component = instance;
    setupComponent(instance);
    setupRenderEffect(instance,vnode, container);
  }
  function updateComponent(n1,n2,container,parentComponent) {
    
  }
  function setupRenderEffect(instance,vnode,container) {
    instance.update = effect(() => { }, {
      scheduler: () => {
        
      }
    })
  }
  return {
    render
  }
}
export {
  createRenderer
}