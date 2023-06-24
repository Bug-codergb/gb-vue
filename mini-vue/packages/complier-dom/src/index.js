import { baseComplie } from "../../complier-core/src/index.js";
import { parserOptions } from "./parserOptions.js";
import { transformStyle } from "./transforms/transformStyle.js";
export const DOMNodeTransforms = [
  transformStyle  
];

export function complie(template, options) {
  return baseComplie(template, Object.assign({}, parserOptions, options, {
    nodeTransforms: [
      ...DOMNodeTransforms
    ]
  }));
}

export * from "../../complier-core/src/index.js";