import { baseComplie } from "../../complier-core/index.js";
import { parserOptions } from "./parserOptions.js";
export function complie(template, options) {
  return baseComplie(template,Object.assign({},parserOptions,options));
}