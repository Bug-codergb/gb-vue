import {track,trigger } from "./effect.js"
const createGetter = () => {
  return (target,key,receiver) => {
    track(target, key);
    return Reflect.get(target, key, receiver);
  }
}
const createSetter = () => {
  return (target,key,newValue,receiver) => {
    Reflect.set(target, key, newValue, receiver);
    trigger(target, key, newValue);
    return true;
  }
}
const get = createGetter();
const set = createSetter();
const multableHandler = {
  get,
  set
}
export {
  multableHandler
}