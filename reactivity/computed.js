import { effect } from "./effect.js";
import { trigger ,track} from "./effect.js";
const computed = (getter) => {
  let value;
  let dirty = true;
  let effectFn = effect(getter, {
    lazy: true,
    scheduler(fn) {//悬念
      if (!dirty) {
        dirty = true;
        trigger(obj,'value');
      }
    }
  })

  let obj = {
    get value() {
      if (dirty) {
        let result = effectFn();
        value = result;
        dirty = false;
        track(obj,'value');
        return result;
      } else {
        return value;
      }
    }
  }
  return obj;
}
export {
  computed
}
