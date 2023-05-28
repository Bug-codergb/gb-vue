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
  RAW: "_v_is_raw",
  REACTIVE: "_v_is_reactive",
  READONLY:"_v_is_readonly"
}
const reactive = (raw) => {
  return createReactive(raw,false,reactiveMap,baseHandler);
}

const shallowReactive = (raw) => {
  return createReactive(raw,false,shallowReactive,shallowReactiveHandler);
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