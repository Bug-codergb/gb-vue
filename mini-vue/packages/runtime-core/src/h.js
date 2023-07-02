import { createVode } from './vnode.js';

const h = (type, props, children) => createVode(type, props, children);
export {
  h,
};
