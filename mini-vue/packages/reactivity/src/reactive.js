import { def } from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import {
  baseHandler,
  readonlyHandler,
  shallowReactiveHandler,
  shallowReadonlyHandlers,
} from './baseHandler.js';

const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();

const shallowReactiveMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();

const ReactiveFlags = {
  RAW: 'raw',
  SKIP: '_v_skip',
  REACTIVE: '_v_isReactive',
  READONLY: '_v_isReadonly',
  SHALLOW: '_v_isShallow',
};
const reactive = (raw) => createReactive(raw, false, reactiveMap, baseHandler);
export const isReactive = (value) => {
  if (isReadonly(value)) {
    return isReactive(value[ReactiveFlags.RAW]);
  }
  return !!(value[ReactiveFlags.REACTIVE]);
};
const shallowReactive = (raw) => createReactive(raw, false, shallowReactiveMap, shallowReactiveHandler);
const isShallow = (value) => !!value[ReactiveFlags.SHALLOW];
const shallowReadonly = (raw) => createReactive(raw, true, shallowReadonlyMap, shallowReadonlyHandlers);
const readonly = (raw) => createReactive(raw, true, readonlyMap, readonlyHandler);
const isReadonly = (value) => !!value[ReactiveFlags.READONLY];

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

export function markRaw(value) {
  def(value, ReactiveFlags.SKIP, true);
  return value;
}

const createReactive = (raw, isReadonly, proxyMap, handler) => {
  if (!isObject(raw)) {
    console.warn('this is not a object ,cant not be reactive');
    return raw;
  }

  if (raw[ReactiveFlags.RAW] && !(isReadonly && raw[ReactiveFlags.REACTIVE])) {
    return raw;
  }

  let proxy = proxyMap.get(raw);
  if (proxy) {
    return proxy;
  }
  if (!proxy) {
    proxy = new Proxy(raw, handler);
    proxyMap.set(raw, proxy);
    return proxy;
  }
};
export {
  reactive,
  readonly,
  shallowReactive,
  ReactiveFlags,
  isReadonly,
  isShallow,
  shallowReadonly,
  reactiveMap,
  readonlyMap,
  shallowReactiveMap,
  shallowReadonlyMap,
};
