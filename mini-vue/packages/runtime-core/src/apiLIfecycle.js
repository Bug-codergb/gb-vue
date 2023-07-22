import { pauseTracking, resetTracking } from '../../reactivity/src/effect.js';
import { currentInstance } from './component.js';
import { LifecycleHooks } from './enum.js';

export function injectHook(type, hook, target, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (
      hook.__weh = (...args) => {
        if (target.isUnmounted) {
          return;
        }
        pauseTracking();
        const res = hook.call(target, args);
        resetTracking();
        return res;
      }
    );
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
  }
}
export const createHook = (lifecycle) => {
  console.log('注入生命周期');
  return (hook, target=currentInstance) => injectHook(lifecycle, (...args) => hook(...args), target);
};
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
export const onUmounted = createHook(LifecycleHooks.UNMOUNTED);
