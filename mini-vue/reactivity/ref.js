import {
  reactive
} from "./reactive";

import {
  trackEffects,
  triggerEffects
} from "./effect"
class RefImpl{
  constructor(raw) {
    this._rawValue = raw;
    this._v_is_ref = true;
    this.dep = [];
    this._value = covert(raw);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    triggerRefValue(this);
    this._value = covert(newValue);
  }
}
const isObject = (value) => {
  return typeof value === "object" && value !== null;
}
const covert = (value) => {
  return isObject(value) ? reactive(value) : value;
}

const trackRefValue = (ref) => {
  trackEffects(ref.dep);
}
const triggerRefValue = (ref) => {
  triggerEffects(ref.dep);
}