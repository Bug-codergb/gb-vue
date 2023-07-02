import { effect, trigger, track } from './effect.js';

const computed = (getter) => {
  let value;
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler(fn) { // 悬念
      if (!dirty) {
        dirty = true;
        trigger(obj, 'value');
      }
    },
  });

  let obj = {
    get value() {
      if (dirty) {
        const result = effectFn();
        value = result;
        dirty = false;
        track(obj, 'value');
        return result;
      }
      return value;
    },
  };
  return obj;
};
export {
  computed,
};
