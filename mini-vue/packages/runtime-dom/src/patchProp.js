import { isOn } from '../../shared/src/general.js';
import { patchClass } from './modules/class.js';
import { patchStyle } from './modules/style.js';
import { patchEvent } from './modules/events.js';

const nativeOnRE = /^on[a-z]/;
export const patchProp = (el, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue);
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue);
  }
};
