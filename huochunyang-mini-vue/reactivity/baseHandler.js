import { track, trigger } from './effect.js';

const createGetter = () => (target, key, receiver) => {
  track(target, key);// 依赖收集
  return Reflect.get(target, key, receiver);
};
const createSetter = () => (target, key, newValue, receiver) => {
  const isSuccess = Reflect.set(target, key, newValue, receiver);
  trigger(target, key, newValue);// 触发依赖
  return isSuccess;
};
const get = createGetter();
const set = createSetter();
const multableHandler = {
  get,
  set,
};
export {
  multableHandler,
};
