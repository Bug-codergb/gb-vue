import { shapeFlags } from '../../shared/src/index.js';

export const initSlots = (instance, children) => {
  console.log(instance);
  if (instance.vnode.shapeFlag & shapeFlags.SLOTS_CHILDREN) {
    console.log(instance.vnode);
    debugger;
  }
};
