import { multableHandler } from "./baseHandler.js";
const proxyWeakMap = new WeakMap(); 
const createReactive = (raw) => {
  if (!raw) {
    return raw;
  }
  let proxy = proxyWeakMap.get(raw);
  if (proxy) {
    return proxy;
  }
  proxy = new Proxy(raw, multableHandler);
  proxyWeakMap.set(raw, proxy);

  return proxy;
}
export {
  createReactive
}