export { registerRuntimeCompiler } from './component.js';
export { normalizeProps, normalizeClass, normalizeStyle } from '../../shared/src/normalizeProp.js';
export { toDisplayString } from '../../shared/src/toDisplayString.js';
export {
  createTextVNode,
  createElementVNode,
  guardReactiveProps,
  mergeProps,
  openBlock,
  createBlock,
  createElementBlock,
  closeBlock,
  createCommentVNode,
  createVNode,
} from './vnode.js';
export {
  Comment,
  Fragment,
  Text,

} from './vnode.js';
export { withDirectives } from './directives.js';

export {
  reactive,
  ref,
  readonly,
  isRef,
  unRef,
  isReadonly,
  shallowReadonly,
} from '../../reactivity/src/index.js';

export {
  watch,
} from './apiWatch.js';

export {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUmounted,
} from './apiLIfecycle.js';

export { resolveComponent } from './helpers/resolveAssets.js';

export { renderList } from './helpers/renderList.js';
export { renderSlot } from './helpers/renderSlot.js';
