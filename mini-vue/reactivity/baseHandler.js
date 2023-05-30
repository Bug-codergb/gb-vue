import { ReactiveFlags, reactive,readonly ,reactiveMap,toRaw} from "./reactive.js";
import { ITERATE_KEY, track, trigger } from "./effect.js";
import { isObject, hasChanged } from "../shared/src/index.js";

const get = createGetter(false,false);
const set = createSetter(false,false);

const readonlyGet = createGetter(true,false);

const shallowGet = createGetter(false,true);
const shallowSet = createSetter(false, true);

const arrayInstrumentations = createArrayInstrumentations();

function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    instrumentations[key] = function (...args) {
      const arr = toRaw(this);
      for (let i = 0; i < this.length; i++){
        track(arr,i+'','get'); //执行查找方法时，需要收集依赖，当用户修改arr[index]时触发;
      }
      const res = arr[key](...args); // 使用原始参数查找arg中有的可能为proxy,
      if (res === -1 || res === false) {
        return arr[key](...(args.map((item)=>toRaw(item)))); // 将参数值设置为原始值，再去查找
      } else {
        return res;
      }
    }
  })  
  return instrumentations;
}  

function createGetter(isReadonly,isShallow){
  return (target,key,receiver) => {
    if (key === ReactiveFlags.READONLY) {
      return isReadonly;
    }else if (key === ReactiveFlags.REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.RAW && receiver === reactiveMap.get(target)) {
      return target;
    }

    //判断是否调用数组方法
    const targetIsArray = Array.isArray(target);
    if (!isReadonly) {
      if (targetIsArray && arrayInstrumentations.hasOwnProperty(key)) {
        return Reflect.get(arrayInstrumentations,key,receiver);
      }  
    }
      
    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      track(target, key, "get");
    }

    if (isShallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }  

    return res;
  }
}
function createSetter(isReadonly,isShallow){
  return (target, key, newValue, receiver) => {
    let oldValue = target[key];//获取旧值
    
    const hadKey = Array.isArray(target) ? Number(key) < target.length : target.hasOwnProperty(key);//判断是添加值还是设置值
    const res = Reflect.set(target, key, newValue, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        console.log("新增属性");
        trigger(target, key,newValue,oldValue, "add");
      } else if (hasChanged(newValue, oldValue)) { //前后的值没有发生改变则不需要触发依赖
        console.log("设置属性");
        trigger(target, key,newValue,oldValue, "set");
      }
    }
    return res;
  }
}
const readonlyHandler = {
  readonlyGet,
  set(target,key,newValue,receiver) {
    console.warn("it is readonly");
    return true;
  },
  deleteProperty(target, key) {
    console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`,target)
    return true
  }
}
function deleteProperty(target,key) {
  const hadKey = target.hasOwnProperty(key);
  const oldValue = target[key];
  const result = Reflect.deleteProperty(target, key);
  if (hadKey && result) {
    trigger(target,key,undefined,oldValue,"delete");
  }
  return result;
}
function ownKeys(target) {
  track(target, Array.isArray(target) ? 'length' : ITERATE_KEY, 'iterate');
  return Reflect.ownKeys(target);
}
function has(target,key) {
  console.log(target, key);
}
//对象数据handler ( object,array) 
const baseHandler = {
  get,
  set,
  deleteProperty,
  ownKeys,
  has
}
const shallowReactiveHandler = {
  shallowGet,
  shallowSet
}
export {
  baseHandler,
  readonlyHandler,
  shallowReactiveHandler
}
