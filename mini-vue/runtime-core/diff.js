//该文件用于实现三种diff算法
//简单diff算法
/*
  新节点   旧节点
  3       1      
  1       2
  2       3
*/
export const simpleDiff = (c1,c2,container,anchor,patch,unmount,insert) => {
  let newChildren = c2, oldChildren = c1;
  let lastIndex = 0;
  
  for (let i = 0; i < newChildren.length; i++){
    let find = false;
    const newChild = newChildren[i];
    for (let j = 0; j < oldChildren[j].length; j++){
      const oldChild = oldChildren[j];  
      if (newChild.key === oldChild.key) {
        find = true;
        patch(oldChild,newChild,container);//为什么不直接添加锚点
        if (j < lastIndex) {
          if (newChildren[i - 1]) { // 如果newChildren[i-1]为null则是第一个节点，第一个节点是不需要移动的
            const anchor = newChildren[i - 1].el.nextSibling;
            insert(container,newChild.el,anchor);  
          }
        } else {
          lastIndex = j;
        }
        break;
      }
    }
    if (!find) {
      const prevNode = newChildren[i - 1];
      let anchor = prevNode ? prevNode.el.nextSibling : container.firstChild;
      patch(null,newChild,container,anchor);//这里需要锚点？
    }
  }

  for (let i = 0; i < oldChildren.length; i++){
    const oldChild = oldChildren[i];
    const isExists = newChildren.find((item) => {
      return item.key === oldChild.key;
    })
    if (!isExists) {
      unmount(oldChild);
    }
  }
} 
//双端diff算法2 （vue2）
export const doubleEndDiff = (c1,c2,container,anchor) => {
  let newChildren = c2, oldChildren = c1;
}
//快速diff算法 （vue3）
export const quickDiff = (c1,c2,container,anchor) => {
  let newChildren = c2, oldChildren = c1;
}