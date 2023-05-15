import {
  baseHandler
} from "./baseHandler";
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
const createReactive = (raw,proxyMap,handler) => {
  let proxy = reactiveMap.get(raw);
  if (!proxy) {
    proxy = new Proxy(raw, handler);
    proxyMap.set(raw, proxy);
  }
  return proxy;
}
export {
  reactive
}