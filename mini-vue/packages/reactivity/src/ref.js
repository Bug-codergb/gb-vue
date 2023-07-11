import { hasChanged, isObject } from '../../shared/src/index.js';
import {
  createDep,
} from './dep.js';
import {
  toRaw, toReactive,
  isReactive,
} from './reactive.js';

import {
  isTracking,
  trackEffects,
  triggerEffects,
} from './effect.js';

class RefImpl {
  constructor(raw, isShallow) {
    this._v_isRef = true;
    this._v_isShallow = isShallow;
    this.dep = createDep();
    this._rawValue = isShallow ? raw : toRaw(raw);
    this._value = isShallow ? raw : toReactive(raw);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = toReactive(newValue);
      this._rawValue = newValue;
      triggerRefValue(this);
    }
  }
}

const trackRefValue = (ref) => {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
};
const triggerRefValue = (ref) => {
  triggerEffects(ref.dep);
};
const isRef = (value) => !!value._v_isRef;
const unRef = (ref) => (isRef(ref) ? ref.value : ref);
const ref = (raw) => createRef(raw, false);
const shallowRef = (raw) => createRef(raw, true);
function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue; // 已经是ref则不需要重新创建 ref传入一个shallowRef 仍然是shallowRef
  }
  return new RefImpl(rawValue, shallow);
}

export function proxyRefs(objectWidthRefs) {
  console.log(objectWidthRefs);
  return isReactive(objectWidthRefs) ? objectWidthRefs : new Proxy(objectWidthRefs, shallowUnwrapHandlers);
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => unRef(Reflect.get(target, key, receiver) ?? ''), // 疑问点
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    }
    return Reflect.set(target, key, value, receiver);
  },
};
export {
  trackRefValue,
  triggerRefValue,
  isRef,
  unRef,
  ref,
  shallowRef,
};
