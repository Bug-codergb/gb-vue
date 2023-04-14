import { createDep } from "./dep.js";

let activeEffect = void 0;
const targetMap = new WeakMap();

const track = (target,key) => {
  let map = targetMap.get(target);
  if (!map) {
    targetMap.set(target, map = new Map());
  }
  let dep = map.get(key);
  if (!dep) {
    map.set(key, dep = createDep());
  }
  trackEffects(dep);
}
const trackEffects = (dep) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
} 

const trigger = (target, key, value) => {
  let map = targetMap.get(target, key);
  if (!map) {
    reutrn;
  }
  const dep = map.get(key);
  if (!dep) {
    return;
  }
  //防止死循环
  const effectToRun = new Set(dep);
  effectToRun.forEach((fn) => {
    fn();
  })
}

const cleanup = (effect) => {
  for (let dep of effect.deps) {
    dep.delete(effect);
  }
  effect.deps = [];
}

const effect = (effect) => {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effect();
  }
  effectFn.deps = [];
  effectFn();
}

export {
  track,
  trigger,
  effect
}