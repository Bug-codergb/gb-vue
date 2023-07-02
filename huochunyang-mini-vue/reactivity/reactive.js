import {
  createReactive,
} from './createReactive.js';

const reactive = (raw) => createReactive(raw);
export {
  reactive,
};
