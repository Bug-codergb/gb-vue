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
const trigger = (target, key, value) => {
  let map = targetMap.get(target, key);
  if (!map) {
    reutrn; //没有依赖则不执行
  }
  const dep = map.get(key);

  //防止死循环
  const effectToRun = new Set(dep);
  effectToRun.forEach((fn) => {
    fn();
  })
}

//清除当前effect的依赖项
/*
  例如当前effect为activeEffect 他的依赖项为dep1,dep2,dep3
  比如要删除activeEffect的dep1,dep2,dep3
  而此时dep1正在添加activeEffect
*/
const cleanup = (effect) => {
  for (let dep of effect.deps) {
    dep.delete(effect);
  }
  effect.deps = [];
}

const effect = (effect) => {
  const effectFn = () => {
    activeEffect = effectFn;
    cleanup(effectFn);
    effect();
  }
  effectFn.deps = [];
  effectFn();
}

const trackEffects = (dep) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
} 


//待分析
export function triggerEffects(dep) {
  // 执行收集到的所有的 effect 的 run 方法
  for (const effect of dep) {
    if (effect.scheduler) {
      // scheduler 可以让用户自己选择调用的时机
      // 这样就可以灵活的控制调用了
      // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
export {
  track,
  trigger,
  trackEffects,
  effect
}