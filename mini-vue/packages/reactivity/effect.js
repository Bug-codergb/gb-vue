import {
  createDep,
  finalizeDepMakers,
  initDepMakers,
  wasTracked,
  newTracked
} from "./dep.js";
import {
  isIntegerKey
} from "../shared/src/index.js"
export const ITERATE_KEY = Symbol('iterate');

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

      trackOpBit = 1 << ++effectTrackDepth; // 每次嵌套一层则左移一位

      if (effectTrackDepth <= maxMakerBits) {
        //初始化的时候这里是不会执行的，因为dep的length1为0，更新的时候每一个dep的w置为trackOpBit
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
const trigger = (target, key, newValue, oldValue, type) => {
  //获取对象的键对应的dep(dep是一个set)
  let depMap = proxyMap.get(target);
  if (!depMap) {
    return;
  }
  let deps = [];//存储所有需要执行的effect,不一定全是 depMap.get(key),比如数组新增元素需要触发length的dep
  if (type === "clear") {
    
  } else if (key==="length" && Array.isArray(target)) {
    const newLength = Number(newValue); //如果是修改了数组长度则获取数组最新长度
    //map遍历时 dep为map的value，key为map的key;
    depMap.forEach((dep, key) => {
      //当数组的长度由原来的100变为10，则90个dep需要执行；
      // 这里有一个key 为迭代器（之后处理）;
      if (key === 'length' || (typeof key !=="symbol" && key >= newLength)) {
        deps.push(dep);
      }
    })
  } else {
    //判断key 不为undefined(void 0 === undefinde 防止undefined被修改)
    if (key !== void 0) {
      deps.push(depMap.get(key));
    }

    switch (type) {
      case "add":
        if (!Array.isArray(target)) { //为对象添加一个属性的时候需要触发他的遍历dep
          deps.push(depMap.get(ITERATE_KEY));
        } else if(isIntegerKey(key)){
          //如果是数组添加一个值，则需要触发他length对应的dep;
          deps.push(depMap.get("length"));
        }break;
      case "delete":
        if (!Array.isArray(target)) {//为对象删除一个属性的时候需要触发他的遍历dep
          deps.push(depMap.get(ITERATE_KEY));
        }
        break;
      case "set":  //在修改值的时候不需要触发遍历key的操纵，因为key不变 
        break;
    }
  }
  const effects = [];
  for (let dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }
  //做一个拷贝；
  triggerEffects(createDep(effects));
}
const triggerEffects = (dep) => {
  dep.forEach((effect) => {
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