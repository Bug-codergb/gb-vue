import { createReactive } from "./createReactiveObj.js";
const reactive = (raw) => {
  return createReactive(raw);
}
export {
  reactive
}