// 该文件用于实现三种diff算法
// 简单diff算法
/*
  新节点   旧节点
  3       1
  1       2
  2       3
*/
export const simpleDiff = (c1, c2, container, anchor, patch, unmount, insert) => {
  const newChildren = c2;
  const oldChildren = c1;
  let lastIndex = 0;
  console.log(newChildren, oldChildren);
  for (let i = 0; i < newChildren.length; i++) {
    let find = false;
    const newChild = newChildren[i];
    for (let j = 0; j < oldChildren.length; j++) {
      const oldChild = oldChildren[j];
      if (newChild.key === oldChild.key) {
        find = true;
        console.log(oldChild, newChild);
        patch(oldChild, newChild, container);// 为什么不直接添加锚点
        if (j < lastIndex) {
          if (newChildren[i - 1]) { // 如果newChildren[i-1]为null则是第一个节点，第一个节点是不需要移动的
            const anchor = newChildren[i - 1].el.nextSibling;
            insert(newChild.el, container, anchor);
          }
        } else {
          lastIndex = j;
        }
        break;
      }
    }
    if (!find) {
      console.log(newChild);
      const prevNode = newChildren[i - 1];
      const anchor = prevNode ? prevNode.el.nextSibling : container.firstChild;
      patch(null, newChild, container, anchor);// 这里需要锚点？
    }
  }

  for (let i = 0; i < oldChildren.length; i++) {
    const oldChild = oldChildren[i];
    const isExists = newChildren.find((item) => item.key === oldChild.key);
    if (!isExists) {
      unmount(oldChild, null, null, true);
    }
  }
};
// 双端diff算法2 （vue2）
export const doubleEndDiff = (c1, c2, container, anchor) => {
  const newChildren = c2; const
    oldChildren = c1;
};
// 快速diff算法 （vue3）
export const quickDiff = (c1, c2, container, anchor) => {
  const newChildren = c2; const
    oldChildren = c1;
};
