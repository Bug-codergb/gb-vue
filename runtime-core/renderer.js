const createRenderer = (options) => {
  const {
    createElement,
    insert,
    setElementText
  } = options;
  const render = (vnode,container) => {
    if (vnode) {
      patch(container._vnode, vnode, container);
    } else if(container._vnode){
      container.innerHTML = "";
    }
  }

  const patch = (n1,n2,container) => {
    if (!n1) {
      mountElement(n2, container);  
    } else {
      
    }
  }
  const shouldSetAsProps = (el,key,value) => {
    if (key === 'form' && el.tagName === 'INPUT') {
      return false;
    }
    return key in el;
  }
  const patchProps = (el,key,prevValue,nextValue) => {
    if (shouldSetAsProps(el, key, nextValue)) {
      const type = typeof el[key];  
      if (type === 'boolean' && value === '') {
          el[key] = true;
      } else {
        el[key] = value;
      }
    } else {
      el.setAttribute(key, vnode.props[key]); 
    }
  }
  const mountElement = (vnode, container) => {
    const {type,children } = vnode;
    const el = createElement(type);
    if (children && typeof children === "string") {
      setElementText(el,children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        patch(null,child,container);
      })
    }

    if (vnode.props && Object.keys(vnode.props).length !== 0) {
      const keys = Object.keys(vnode.props);
      for (let key of keys) {
        const value = vnode.props[key];
        patchProps(el, key,null,value);  
      }
    }

    insert(container, children);
  }
  return {
    render
  }
}

//test
createRenderer({
  createElement(type) {
    document.createElement(type)
  },
  insert(container,children) {
    container.appendChild(children);
  },
  setElementText(container,text) {
    container.textContent = text;
  }
})
export {
  createRenderer
}