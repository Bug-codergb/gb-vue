import {
  createDep
} from "./dep";
const proxyMap = new WeakMap();
let activeEffect = void 0;
let shouldTrack = false;
class ReactiveEffect{
  constructor(fn,) {
    this.fn = fn;
    this.active = false;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    shouldTrack = true;
    activeEffect = this;
    let result = this.fn();
    shouldTrack = false;
    activeEffect = undefined;
    return result;
  }
}

const track = (target, key) => {
  let depsMap = proxyMap.get(target);
  if (!depsMap) {
    proxyMap.set(target,depsMap = new Map());
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key,deps = createDep());
  }
  trackEffects(deps);
}
const trackEffects = (deps) => {
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
  }
}
const trigger = (target,key,value) => {
  let depsMap = proxyMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = depsMap.get(key);
  if (!deps) {
    return;
  }
  triggerEffects(deps);
}
const triggerEffects = (deps) => {
  
}
const cleanupEffect = (effectFn) => {
  for (let i = 0; i < effectFn.deps; i++){
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
}
const effect = (fn,options) => {
  const _effect = new ReactiveEffect(fn);
  _effect();
  const runner = _effect.run.bind(_effect);
  return runner;
}
export {
  track,
  trackEffects,
  trigger,
  triggerEffects,
  effect
}