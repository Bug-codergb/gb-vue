export { registerRuntimeCompiler } from "./component.js";
export { normalizeProps ,normalizeClass,normalizeStyle} from "../../shared/src/normalizeProp.js";
export { toDisplayString } from "../../shared/src/toDisplayString.js"
export {
  createTextVNode,
  createElementVNode,
  guardReactiveProps
} from './vnode.js'