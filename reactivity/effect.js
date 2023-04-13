import { createDep } from "./dep.js";

const targetMap = new WeakMap();
const getTargetDep = (target, key) => {
  let map = targetMap.get(target);
  if (!map) {
    targetMap.set(target, map = new Map());
  }
  let dep = map.get(key);
  if (!dep) {
    map.set(key, dep = createDep(activeEffect));
  }
  return dep;
}

const track = (target,key) => {
  const dep = getTargetDep(target, key);
}
const trigger = (target,key,value) => {
  const dep = getTargetDep(target, key);
  trackEffects(dep);
}
let activeEffect = {};
const effect = (effect) => {
  activeEffect = effect;
  activeEffect();
  activeEffect = {};
}
const trackEffects = (deps) => {
  deps.forEach(effect => {
    effect();
  });
}
export {
  track,
  trigger,
  trackEffects,
  effect
}