import { baseComplie } from "../../complier-core/src/index.js";
import { parserOptions } from "./parserOptions.js";
export function complie(template, options) {
  return baseComplie(template,Object.assign({},parserOptions,options));
}