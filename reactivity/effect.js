import { createDep } from "./dep.js";

let shouldTrack = false;
let activeEffect = void 0;
class ReactiveEffect{
  constructor(fn) {
    this.fn = fn;
    this.active = true;
    this.deps = [];
    this.scheduler = undefined;
  }
  run() {
    //执行fn但是不收集依赖
    if (!this.active) {
      return this.fn(); 
    }
    
    //收集依赖(执行用户传入的fn)
    shouldTrack = true;
    activeEffect = this;

    const result = this.fn();

    shouldTrack.false;
    activeEffect = undefined;
    return result;
  }
  stop() {
    
  }
}


const targetMap = new WeakMap();

/*
做个优化，代码就不抽离了
const getTargetDep = (target, key) => {
  let map = targetMap.get(target);
  if (!map) {
    targetMap.set(target, map = new Map());
    console.log(1)
  }
  let dep = map.get(key);
  if (!dep) {
    map.set(key, dep = createDep(activeEffect));
  }
  return dep;
}*/

const track = (target,key) => {
  //const dep = getTargetDep(target, key);
  let map = targetMap.get(target);
  if (!map) {
    targetMap.set(target, map = new Map());
  }
  let dep = map.get(key);
  if (!dep) {
    map.set(key, dep = createDep());
  }
  /*
    dep中有多个effect;
    每个key 对应一个dep;
    一个dep中可能有 多个响应式的属性

    // 1个effect(可能是obj1的key)
    ()=>{//组件a
     console.log(obj1.key);
     console.log(obj2.value);
     console.log(obj3.label);
    },
    // 2 个effect
    ()=>{组件b
      console.log(obj1.key);
    }
    //3个effect
    ()=>{//组件c
      console.log(obj1.key);
    }
  */
  trackEffects(dep);
}
const trigger = (target,key,value) => {
  // const dep = getTargetDep(target, key);
  //trackEffects(dep);
  let map = targetMap.get(target, key);
  if (!map) {
    reutrn; //没有依赖则不执行
  }

  const dep = map.get(key);

}

const effect = (effect) => {
  const _effect = new ReactiveEffect(effect);//就是把用户传入的fn进行执行
  _effect.run();

}

const trackEffects = (dep) => {
  // deps.forEach(effect => {
  //   effect();
  // });

  /* 1个effect(可能是obj1的key)
    ()=>{//组件a
     console.log(obj1.key);
     console.log(obj2.value);
     console.log(obj3.label);
    },
  */
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