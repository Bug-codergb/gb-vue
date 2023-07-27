import {
  addEventListener,
} from '../modules/events.js';
import {
  invokArrayFns,
  isArray,
  looseToNumber,
} from '../../../shared/src/general.js';

const getModelAssigner = (vnode) => {
  const fn = vnode.props['onUpdate:modelValue'];
  return isArray(fn) ? (value) => invokArrayFns(fn, value) : fn;
};
export const vModelText = {
  created(el, { modifiers: { lazy, trim, number } }, vnode) {
    el._assign = getModelAssigner(vnode);

    const castToNumber = number || (vnode.props && vnode.props.type === 'number');
    addEventListener(el, lazy ? 'change' : 'input', (e) => {
      let domValue = el.value;
      if (trim) {
        domValue = domValue.trim();
      }
      if (castToNumber) {
        domValue = looseToNumber(domValue);
      }
      el._assign(domValue);
    });

    if (trim) {
      addEventListener(el, 'change', () => {
        el.value = el.value.trim();
      });
    }
  },
  mounted(el, { value }) {
    el.value = value == null ? '' : value;
  },
  beforeUpdate(el, { value, modifiers: { lazy, trim, number } }, vnode) {
    const newValue = value === null ? '' : value;
    if (el.value !== newValue) {
      el.value = newValue;
    }
  },
};
