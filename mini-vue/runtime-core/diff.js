//该文件用于实现三种diff算法
//简单diff算法
export const simpleDiff = (c1,c2,container,anchor) => {
  let newChildren = c2, oldChildren = c1;
} 
//双端diff算法2 （vue2）
export const doubleEndDiff = (c1,c2,container,anchor) => {
  let newChildren = c2, oldChildren = c1;
}
//快速diff算法 （vue3）
export const quickDiff = (c1,c2,container,anchor) => {
  let newChildren = c2, oldChildren = c1;
}