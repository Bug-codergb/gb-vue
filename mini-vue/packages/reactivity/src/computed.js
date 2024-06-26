import { createDep } from './dep.js';
import { ReactiveEffect } from './effect.js';
import { trackRefValue, triggerRefValue } from './ref.js';

class ComputedRefImpl {
  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
      triggerRefValue(this);
    });
  }

  get value() {
    if (this._dirty) {
      trackRefValue(this);
      this._dirty = false;
      this._value = this._effect.run();// 就是把getter重新执行一边
    }
    return this._value;
  }
}
const computed = (getter) => new ComputedRefImpl(getter);
export {
  computed,
};
