import { ReactiveFlags } from "./reactive.js";
import { track,trigger } from "./effect.js";
const get = createGetter();
const set = createSetter();

const readonlyGet = createGetter();
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
      track(target, key);
    }
    return res;
  }
}
function createSetter(){
  return (target,key,newValue,receiver) => {
    const res = Reflect.set(target, key, newValue, receiver);
    trigger(target, key, newValue);
    return res;
  }
}
const readonlyHandler = {
  readonlyGet,
  set(target,key,newValue,receiver) {
    console.warn("it is readonly");
    return true;
  }
}
const baseHandler = {
  get,
  set
}
export {
  baseHandler,
  readonlyHandler
}