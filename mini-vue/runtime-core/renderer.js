import ShapeFlags from "../shared/src/shapeFlags.js";
import {
  Text,
  Fragment
} from "./vnode.js";
const createRenderer = (options) => {
  const {
    createElement,
    setElementText:hostSetElementText,
    patchProp:hostPatchProps,
    remove,
    insert,
    createText
  } = options;
  const render = (vnode,container) => {
    patch(null, vnode, container);
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
  function processElement(n1,n2,container,anchor,parentComponent) {
    if (!n1) {
      mountElement(n2, container, anchor);
    } else {
      updateElement(n1,n2,container,anchor,parentComponent);
    }
  }
  //patchProps
  function patchProps(el,key,oldProps,newProps) {
    for (let key in newProps) {
      const prevProps = oldProps[key];
      const nextProps = newProps[key];
      if (prevProps !== nextProps) {
        hostPatchProps(el, key, prevProps,nextProps);
      }
    }
    for (let key in oldProps) {
      const prevPrsop = oldProps[key];
      if (!(key in newProps)) {
        hostPatchProps(el, key, prevPrsop, null);
      }
    }
  }
  // element -> mount
  function mountElement(vnode,container,anchor){
    const { shapeFlag, type,props } = vnode;
    const el = createElement(type);
    if (shapeFlag && ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el,vnode.children);
    } else if (shapeFlag && ShapeFlags.ARRAY_CHILDREN) {
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
    patchProps(el, oldProps, newProps);
    patchChildren(n1,n2,el,anchor,parentComponent);
  }
  function patchChildren(n1,n2,container,anchor,parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c1 !== c2) {
        hostSetElementText(container,c2);
      }
    }else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2,container);
      } else {
        patchKeyedChildren(c1,c2,container,anchor,parentComponent);    
      }
    }
  }
  function patchKeyedChildren(c1,c2,container,anchor,parentComponent) {
    
  }
  return {
    render
  }
}
export {
  createRenderer
}