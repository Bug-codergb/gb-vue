import { createDep } from "./dep.js";
import { ReactiveEffect } from "./effect.js";
import { trackRefValue,triggerEffects } from "./ref.js";
class ComputedRefImpl{
  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    this._effect = new ReactiveEffect(getter, ()=>{
      this._dirty = true;
      trackRefValue(this);
    }); 
  }
  get value() {
    if (this._dirty) {
      trackRefValue(this);
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}
const computed = (getter) => {
  return new ComputedRefImpl(getter);
}
export {
  computed
}