import {
  isString
} from "../../shared/src/general.js";
import { baseParser } from "./parser.js";
import { transform } from "./transform.js";
import { transformIf } from "./transforms/vIf.js";
import { transformText } from "./transforms/transformText.js";
import { transformElement } from "./transforms/transformElement.js";

import { transformBind } from "./transforms/vBind.js";
export function getBaseTransformPreset() {
  return [
    [
      //transformIf,
      transformText,
      //transformElement
    ],
    {
      on: () => { },
      bind: transformBind,
      model: () => { }
      
    }
  ]
}
export function baseComplie(template, options) {
  const isModuleMode = options.mode === "module";
  const ast = isString(template) ? baseParser(template, options) : template;
  
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()

console.log(directiveTransforms)
  transform(
    ast,
    Object.assign(
      {},
      options,
      {
        nodeTransforms: [...nodeTransforms],
        directiveTransforms: Object.assign(
          {},
          directiveTransforms
        )
      }
    )
  );
  console.log(ast);
}