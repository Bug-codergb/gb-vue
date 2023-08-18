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
export const doubleEndDiff = (c1, c2, container, anchor, patch, unmount, insert) => {
  const newChildren = c2;
  const oldChildren = c1;

  let oldStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newStartIndex = 0;
  let newEndIndex = newChildren.length - 1;

  let oldStartNode = oldChildren[oldStartIndex];
  let oldEndNode = oldChildren[oldEndIndex];
  let newStartNode = newChildren[newStartIndex];
  let newEndNode = newChildren[newEndIndex];

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartNode) {
      oldStartNode = oldChildren[++oldStartIndex];
    } else if (!oldEndNode) {
      oldEndNode = oldChildren[--oldEndIndex];
    } else if (oldStartNode.key === newStartNode.key) {
      patch(oldStartNode, newStartNode, container);
      newStartNode = newChildren[++newStartIndex];
      oldStartNode = oldChildren[++oldStartIndex];
    } else if (oldEndNode.key === newEndNode.key) {
      patch(oldEndNode, newEndNode, container);
      newEndNode = newChildren[--newEndIndex];
      oldEndNode = oldChildren[--oldEndIndex];
    } else if (oldStartNode.key === newEndNode.key) {
      patch(oldStartNode, newEndNode, container);
      insert(oldStartNode.el, container, oldEndNode.el.nextSibling);

      oldStartNode = oldChildren[++oldStartIndex];
      newEndNode = newChildren[--newEndIndex];
    } else if (oldEndNode.key === newStartNode.key) {
      patch(oldEndNode, newStartNode, container);
      insert(oldEndNode.el, container, oldStartNode.el);
      newStartNode = newChildren[++newStartIndex];
      oldEndNode = oldChildren[--oldEndIndex];
    } else {
      const indexOld = oldChildren.findIndex((node) => node.key === newStartNode.key);
      if (indexOld > 0) {
        const vnodeToMove = oldChildren[indexOld];
        patch(vnodeToMove, newStartNode, container);
        insert(vnodeToMove.el, container, oldStartNode.el);
        oldChildren[indexOld] = undefined;
      } else {
        patch(null, newStartNode, container, oldStartNode.el);
      }
      newStartNode = newChildren[++newStartIndex];
    }
  }
  console.log(newChildren.slice(newStartIndex, newEndIndex + 1));
  console.log(oldChildren.slice(oldStartIndex, oldEndIndex + 1));
  // oldVNode已经对比完毕，但是新节点仍然存在
  if (oldEndIndex < oldStartIndex && newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      patch(null, newChildren[i], container, oldStartNode.el);
    }
  } else if (newEndIndex < newStartIndex && oldStartIndex <= oldEndIndex) {
    console.log(oldChildren);
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      console.log(oldChildren[i]);
      if (oldChildren[i]) unmount(oldChildren[i], null, null, true);
    }
  }
};
// 快速diff算法 （vue3）
export const quickDiff = (c1, c2, container, anchor, patch, unmount, insert) => {
  const newChildren = c2; const
    oldChildren = c1;
};
