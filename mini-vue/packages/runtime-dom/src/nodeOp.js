const doc = typeof document !== 'undefined' ? document : null;
export const nodeOps = {
  insert: (child, parent, anchor) => {
    if (child) parent.insertBefore(child, anchor);
  },
  remove: (child) => {
    console.log(child);
    const parent = child.parentNode;
    console.log(parent);
    if (parent) {
      parent.removeChild(child);
    }
  },
  createElement: (tag, props) => {
    const el = doc.createElement(tag);
    return el;
  },
  createText: (text) => {
    doc.createTextNode(text);
  },
  createComment: (text) => doc.createComment(text),
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode || null,
  nextSibling: (node) => node.nextSibling,
};
