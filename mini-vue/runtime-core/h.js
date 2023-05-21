import { createVode } from "./vnode.js";
const h = (type,props,children) => {
  return createVode(type,props,children);
}
export {
  h
}