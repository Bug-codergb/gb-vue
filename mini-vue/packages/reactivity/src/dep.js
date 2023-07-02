import {
  trackOpBit,
} from './effect.js';

const createDep = (effects) => {
  const dep = new Set(effects);
  dep.w = 0;
  dep.n = 0;
  return dep;
};
const wasTracked = (dep) => (trackOpBit & dep.w) > 0// 这里注意运算符优先级
;
const newTracked = (dep) => (trackOpBit & dep.n) > 0// 这里注意运算符优先级
;
const initDepMakers = (reactiveEffect) => {
  const { deps } = reactiveEffect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      dep.w |= trackOpBit;
    }
  }
};
const finalizeDepMakers = (reactiveEffect) => {
  const { deps } = reactiveEffect;
  if (deps.length) {
    let ptr = 0;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(reactiveEffect);
      } else {
        // 当dep中删除effect时，effect同时也要删除dep(从effect的deps中);
        deps[ptr++] = dep;
      }
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
  }
};
export {
  createDep,
  initDepMakers,
  finalizeDepMakers,
  wasTracked,
  newTracked,
};
