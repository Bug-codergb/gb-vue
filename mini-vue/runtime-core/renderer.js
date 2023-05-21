const createRenderer = (options) => {
  const {
    createElement,
    setElementText,
    remove,
    insert,
    createText
  } = options;
  const render = (vnode,container) => {
    patch(null, vnode, container);
  }
  function patch(n1,n2,container,anchor,parentComponent){
    const { type,shapeFlags } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container); break;
      case Fragment:
        processFragment(n1, n2, container); break;
      default:
        if (shapeFlags && shapeFlags.ELEMENT) {
          processElement(n1,n2,container,anchor,parentComponent);
        } else if (shapeFlags && shapeFlags.STATEFUL_COMMENT) {
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
  function mountElement(vnode,container,anchor){
    const { shapeFlag, type } = vnode;
    const el = createElement(el);
    if (shapeFlag && shapeFlags.TEXT_CHILDREN) {
      setElementText(el,vnode.children);
    } else if (shapeFlag && shapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children,el);
    }
  }
  function mountChildren(children,container) {
    children.forEach((child) => {
      patch(null, child, container);
    })
  }
  function updateElement() {
    
  }
}
export {
  createRenderer
}