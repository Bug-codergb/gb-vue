import {
  baseHandler,
  readonlyHandler
} from "./baseHandler.js";
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

const ReactiveFlags = {
  RAW: "_v_is_raw",
  REACTIVE: "_v_is_reactive",
  READONLY:"_v_is_readonly"
}
const reactive = (raw) => {
  return createReactive(raw,reactiveMap,baseHandler);
}
const readonly = (raw) => {
  return createReactive(raw, readonlyMap, readonlyHandler);
}
const isReadonly = (value) => {
  return !!value[ReactiveFlags.READONLY];
}
const createReactive = (raw,proxyMap,handler) => {
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
  isReadonly
}