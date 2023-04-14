import {
  createReactive
} from "./createReactive.js";
const reactive = (raw) => {
  return createReactive(raw);
}
export {
  reactive
}