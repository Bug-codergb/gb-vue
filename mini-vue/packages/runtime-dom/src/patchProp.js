import { patchClass } from './modules/class.js';
import { patchStyle } from './modules/style.js';

export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  }
};
