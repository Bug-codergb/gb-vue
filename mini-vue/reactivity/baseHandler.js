import { ReactiveFlags, reactive,readonly } from "./reactive.js";
import { track, trigger } from "./effect.js";
import { isObject } from "../shared/src/index.js";
const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter(true,false);

const shallowGet = createGetter(false,true);
const shallowSet = createSetter(false,true);
function createGetter(isReadonly,isShallow){
  return (target,key,receiver) => {
    if (key === ReactiveFlags.READONLY) {
      return isReadonly;
    }
    if (key === ReactiveFlags.REACTIVE) {
      return !isReadonly;
    }

    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      track(target, key,"get");
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
  return (target,key,newValue,receiver) => {
    const res = Reflect.set(target, key, newValue, receiver);
    trigger(target, key, "set");
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
const baseHandler = {
  get,
  set
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