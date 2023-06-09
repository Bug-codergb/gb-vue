import {
  isString
} from "../../shared/src/general.js";
import { baseParser } from "./parser.js";
export function baseComplie(template, options) {
  const isModuleMode = options.mode === "module";
  const ast = isString(template) ? baseParser(template, options) : template;
  console.log(ast);
}