import {
  createDep,
  finalizeDepMakers,
  initDepMakers,
  wasTracked,
  newTracked
} from "./dep.js";

const proxyMap = new WeakMap();
let activeEffect = void 0;
let shouldTrack = false;

let effectTrackDepth = 0;
let maxMakerBits = 30; //effect最大嵌套层级, 每嵌套一级则左移一位
export let trackOpBit = 1;

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
    let lastShouldTrack = shouldTrack;
    try {
      this.parent = activeEffect;
      shouldTrack = true;
      activeEffect = this;

      trackOpBit = 1 << ++effectTrackDepth;

      if (effectTrackDepth <= maxMakerBits) {
        initDepMakers(this);  
      } else {
        cleanupEffect(this);
      }
      let result = this.fn();
      return result;
    } finally {
      if (effectTrackDepth <= maxMakerBits) {
        finalizeDepMakers(this);
      }
      trackOpBit = 1 << --effectTrackDepth;

      activeEffect = this.parent;
      shouldTrack = lastShouldTrack;
      this.parent = undefined;
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
  let shouldTrack = false;
  if (effectTrackDepth<=maxMakerBits) {
    if (!newTracked(dep)) {
      dep.n = dep.n | trackOpBit;
      shouldTrack = !wasTracked(dep);
    }
  } else {
    shouldTrack = !dep.has(activeEffect);
  }
  if (shouldTrack) {
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
  for (let i = 0; i < effectFn.deps.length; i++){
    const dep = effectFn.deps[i];
    dep.delete(effectFn);
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