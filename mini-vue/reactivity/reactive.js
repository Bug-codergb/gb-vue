import { isObject } from "../shared/src/index.js";
import {
  baseHandler,
  readonlyHandler,
  shallowReactiveHandler
} from "./baseHandler.js";
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

const shallowReactiveMap = new WeakMap();

const ReactiveFlags = {
  RAW: "raw",
  REACTIVE: "_v_isReactive",
  READONLY: "_v_isReadonly",
  SHALLOW:"_v_isShallow"
}
const reactive = (raw) => {
  return createReactive(raw,false,reactiveMap,baseHandler);
}

const shallowReactive = (raw) => {
  return createReactive(raw,false,shallowReactiveMap,shallowReactiveHandler);
}
const shallowReadonly = (raw) => {
  
}
const readonly = (raw) => {
  return createReactive(raw, false,readonlyMap, readonlyHandler);
}
const isReadonly = (value) => {
  return !!value[ReactiveFlags.READONLY];
}

export function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW];
  return raw ? toRaw(raw) : observed;
}
export function toReactive(raw) {
  return isObject(raw) ? reactive(raw) : raw;
}
export function toReadonly(raw) {
  return isObject(raw) ? readonly(raw) : raw;
}
const createReactive = (raw, isReadonly,proxyMap, handler) => {
  if (!isObject(raw)) {
    console.warn("value can not be made reactive");
    return raw;
  }
  let proxy = reactiveMap.get(raw);
  if (proxy) {
    return proxy;
  }
  if (!proxy) {
    proxy = new Proxy(raw, handler);
    proxyMap.set(raw, proxy);
    return proxy;
  }
}
export {
  reactive,
  readonly,
  ReactiveFlags,
  isReadonly,
  shallowReadonly,
  reactiveMap
}