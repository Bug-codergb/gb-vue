import {
  isString
} from "../../shared/src/general.js";
import { baseParser } from "./parser.js";
import { transform } from "./transform.js";
import { transformIf } from "./transforms/vIf.js";

export function getBaseTransformPreset() {
  return [
    [
      transformIf  
    ],
    {
      on: () => { },
      bind: () => { },
      model: () => { }
      
    }
  ]
}
export function baseComplie(template, options) {
  const isModuleMode = options.mode === "module";
  const ast = isString(template) ? baseParser(template, options) : template;
  
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()


  transform(
    ast,
    Object.assign(
      {},
      options,
      {
        nodeTransforms: [...nodeTransforms],
        directiveTransform: Object.assign(
          {},
          
        )
      }
    )
  );
  console.log(ast);
}