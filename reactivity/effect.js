import { createDep } from "./dep.js";

let activeEffect = void 0;
let effectStack = [];
const targetMap = new WeakMap();

const track = (target, key) => {
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
  console.log(dep,activeEffect)
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    if(activeEffect) activeEffect.deps.push(dep);
  }
} 

const trigger = (target, key, value) => {
  console.log(target,key)
  let map = targetMap.get(target, key);
  if (!map) {
    return;
  }
  const dep = map.get(key);
  if (!dep) {
    return;
  }
  //防止死循环
  const effectToRun = new Set();
  for (let item of dep) {
    if (item !== activeEffect) {
      effectToRun.add(item)
    }
  }
  console.log(effectToRun)
  effectToRun.forEach((fn) => {
    console.log(fn);
    if (fn.options && fn.options.scheduler) {
      fn.options.scheduler(fn);
    } else {
      console.log(fn)
      fn(); 
    }
  })
}

const cleanup = (effect) => {
  for (let dep of effect.deps) {
    dep.delete(effect);
  }
  effect.deps = [];
}

const effect = (effect,options) => {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);

    let result = effect();
    
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return result;
  }

  if(options) effectFn.options = options;
  effectFn.deps = [];
  
  if ((!options) || !options.lazy) {
    console.error(activeEffect)
    effectFn(); //是否立即执行
  } 
  return effectFn;
}

export {
  track,
  trigger,
  effect
}