import { hasChanged, isObject } from "../../shared/src/index.js";
import {
  createDep
} from "./dep.js"
import {
  toRaw, toReactive
} from "./reactive.js";

import {
  isTracking,
  trackEffects,
  triggerEffects
} from "./effect.js"
class RefImpl{
  constructor(raw,isShallow) {
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
    if (hasChanged(newValue,this._rawValue)) {
      this._value = covert(newValue);
      this._rawValue = newValue 
      triggerRefValue(this);
    }
  }
}

const trackRefValue = (ref) => {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}
const triggerRefValue = (ref) => {
  triggerEffects(ref.dep);
}
const isRef = (value) => {
  return !!value[`_v_isRef`];
}
const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
}
const ref = (raw) => {
  return createRef(raw,false);
}
const shallowRef = (raw) => {
  return createRef(raw, true);
}
function createRef(rawValue,shallow) {
  if (isRef(rawValue)) {
    return rawValue //已经是ref则不需要重新创建 ref传入一个shallowRef 仍然是shallowRef
  }
  return new RefImpl(rawValue,shallow);
}
export {
  trackRefValue,
  triggerRefValue,
  isRef,
  unRef,
  ref,
  shallowRef
}