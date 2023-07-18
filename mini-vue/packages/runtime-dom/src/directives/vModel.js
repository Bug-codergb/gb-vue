import {
  addEventListener,
} from '../modules/events.js';
import {
  looseToNumber,
} from '../../../shared/src/general.js';

export const vModelText = {
  created(el, { modifiers: { lazy, trim, number } }, vnode) {
    const castToNumber = number || (vnode.props && vnode.props.type === 'number');
    addEventListener(el, lazy ? 'change' : 'input', (e) => {
      let domValue = el.value;
      if (trim) {
        domValue = domValue.trim();
      }
      if (castToNumber) {
        domValue = looseToNumber(domValue);
      }
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
};
