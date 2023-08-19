// 该文件用于实现三种diff算法
// 简单diff算法

import { isSameVNodeType } from './vnode.js';

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
      const indexOld = oldChildren.findIndex((node) => node && (node.key === newStartNode.key));
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

  // oldVNode已经对比完毕，但是新节点仍然存在
  if (oldEndIndex < oldStartIndex && newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      patch(null, newChildren[i], container, oldStartNode.el);
    }
  } else if (newEndIndex < newStartIndex && oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      console.log(oldChildren[i]);
      if (oldChildren[i]) unmount(oldChildren[i], null, null, true);
    }
  }
};
// 快速diff算法 （vue3）
export const quickDiff = (c1, c2, container, anchor, patch, unmount, insert) => {
  if (c1.length < 1 && c2.length < 1) {
    return;
  }
  const newChildren = c2;
  const oldChildren = c1;

  let e1 = c1.length - 1;
  let e2 = c2.length - 1;
  // 前置节点处理
  let j = 0;

  while (j <= e1 && j <= e2) {
    const oldNode = oldChildren[j];
    const newNode = newChildren[j];
    if (isSameVNodeType(oldNode, newNode)) {
      patch(oldNode, newNode, container);
    } else {
      break;
    }
    j++;
  }
  // 后置节点处理
  while (j <= e1 && j <= e2) {
    const oldNode = oldChildren[e1];
    const newNode = newChildren[e2];
    if (isSameVNodeType(oldNode, newNode)) {
      patch(oldNode, newNode, container, anchor);
    } else {
      break;
    }
    e1--;
    e2--;
  }

  const oldEndIndex = e1;
  const newEndIndex = e2;
  if (j > oldEndIndex && j <= newEndIndex) { // 新增
    const anchorIndex = newEndIndex + 1;
    const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
    while (j <= newEndIndex) {
      patch(null, newChildren[j++], container, anchor);
    }
  } else if (j > newEndIndex && j <= oldEndIndex) {
    while (j <= oldEndIndex) {
      unmount(oldChildren[j++], null, null, false);
    }
  } else {
    const count = newEndIndex - j + 1;// 以新节点为标准
    if (count < 0) {
      return;
    }
    const source = new Array(count);
    source.fill(-1);

    let moved = false;
    let pos = 0;

    const newStartIndex = j;
    const oldStartIndex = j;
    const keyIndex = {};
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      keyIndex[newChildren[i].key] = i;
    }
    console.log(keyIndex);
    let patched = 0;
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      const oldNode = oldChildren[i];
      if (patched < count) {
        const k = keyIndex[oldNode.key];// 旧节点在新节点中的位置
        if (typeof k !== 'undefined') {
          const newNode = newChildren[k];
          patch(oldNode, newNode, container);
          source[k - newStartIndex] = i;
          console.log(JSON.parse(JSON.stringify(source)));
          patched++;
          if (k < pos) {
            moved = true;
          } else {
            pos = k;
          }
        } else {
          unmount(oldNode, null, null, true);
        }
      } else {
        unmount(oldNode, null, null, true);
      }
    }

    if (moved) {
      // source是新节点在旧节点的位置信息
      const seq = getSequence(source);
      let s = seq.length - 1;
      let i = count - 1;// count是新children中需要处理的几点
      for (i; i >= 0; i--) { // 遍历新节点中经过前置，后置处理后的list
        if (source[i] === -1) {
          const pos = i + newStartIndex;
          const newNode = newChildren[pos];
          const nextPos = pos + 1;

          const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;

          patch(null, newNode, container, anchor);
        } else if (i !== seq[s]) {
          const pos = i + newStartIndex;
          const newNode = newChildren[pos];
          const nextPos = pos + 1;
          const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
          insert(newNode.el, container, anchor);
        } else {
          s--;
        }
      }
    }
  }
};
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i; let j; let u; let v; let
    c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
