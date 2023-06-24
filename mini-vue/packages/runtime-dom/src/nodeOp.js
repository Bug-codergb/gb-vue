const doc = typeof document !== 'undefined' ? document : null;
export const nodeOps = {
  insert: (child, parent, anchor) => {
    console.log(child,"---------------------")
    if(child) parent.insertBefore(child,anchor);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }  
  },
  createElement: (tag,props) => {
    const el = doc.createElement(tag);
    return el;
  },
  createText: (text) => {
    doc.createTextNode(text);
  },
  setElementText: (el,text) => {
    el.textContent = text;
  },
  parentNode: (node) => {
    return node.parentNode || null
  },
  nextSibling: (node) => {
    return node.nextSibling;
  }
}