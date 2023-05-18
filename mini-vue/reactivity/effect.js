import {
  createDep
} from "./dep.js";
const proxyMap = new WeakMap();
let activeEffect = void 0;
let shouldTrack = false;
class ReactiveEffect{
  constructor(fn,scheduler) {
    this.fn = fn;
    this.active = true;
    this.deps = [];
    this.parent = undefined;
    this.scheduler = scheduler;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    let lastShouldTrack = false;
    try {
      lastShouldTrack = shouldTrack ;
      this.parent = activeEffect;

      shouldTrack = true;
      activeEffect = this;
      let result = this.fn();
      return result;
    } finally {
      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
    }
  }
}
const isTracking = () => {
  return activeEffect !== undefined && shouldTrack;
}
const track = (target, key) => {
  if (!isTracking()) {
    return;
  }
  let depMap = proxyMap.get(target);
  if (!depMap) {
    proxyMap.set(target,depMap = new Map());
  }
  let dep = depMap.get(key);
  if (!dep) {
    depMap.set(key,dep = createDep());
  }
  trackEffects(dep);
}
const trackEffects = (dep) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
const trigger = (target,key,value) => {
  let depMap = proxyMap.get(target);
  if (!depMap) {
    return;
  }
  let dep = depMap.get(key);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}
const triggerEffects = (dep) => {
  let execDep = new Set(dep);
  execDep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  })
}
const cleanupEffect = (effectFn) => {
  for (let i = 0; i < effectFn.deps; i++){
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
}
const effect = (fn,options) => {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  return runner;
}
export {
  track,
  trackEffects,
  trigger,
  triggerEffects,
  effect,
  ReactiveEffect,
  isTracking
}