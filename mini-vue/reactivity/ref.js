import { isObject } from "../shared/src/index.js";
import {
  createDep
} from "./dep.js"
import {
  reactive
} from "./reactive.js";

import {
  isTracking,
  trackEffects,
  triggerEffects
} from "./effect.js"
class RefImpl{
  constructor(raw) {
    this._rawValue = raw;
    this._v_is_ref = true;
    this.dep = createDep();
    this._value = covert(raw);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    this._value = covert(newValue);
    this._rawValue = newValue;
    triggerRefValue(this);
  }
}
const covert = (value) => {
  return isObject(value) ? reactive(value) : value;
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
  return !!value[`_v_is_ref`];
}
const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
}
const ref = (raw) => {
  return new RefImpl(raw);
}
export {
  trackRefValue,
  triggerRefValue,
  isRef,
  unRef,
  ref
}