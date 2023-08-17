import {
  isString,
} from '../../shared/src/general.js';
import { baseParser } from './parser.js';
import { transform } from './transform.js';
import { transformFor } from './transforms/vFor.js';
import { transformIf } from './transforms/vIf.js';
import { transformText } from './transforms/transformText.js';
import { transformElement } from './transforms/transformElement.js';
import { transformSlotOutlet } from './transforms/transformSlotOutlet.js';

import { transformBind } from './transforms/vBind.js';
import { transformOn } from './transforms/vOn.js';
import { transformModel } from './transforms/vModel.js';

import { generate } from './codegen.js';

export function getBaseTransformPreset() { // 转换所需预设
  return [
    [
      transformIf,
      transformFor,
      transformSlotOutlet,
      transformElement,
      transformText,
    ],
    { // 转换时指令的处理方法，如果compiler-dom传入则会覆盖，但是compiler-dom中的transform会依赖于这里的transofrm
      on: transformOn,
      bind: transformBind,
      model: transformModel,
    },
  ];
}
export function baseComplie(template, options) {
  const isModuleMode = options.mode === 'module';
  const ast = isString(template) ? baseParser(template, options) : template;

  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();

  transform(
    ast,
    {

      ...options,
      nodeTransforms: [...nodeTransforms],
      directiveTransforms: {
        ...directiveTransforms,
        ...options.directiveTransforms || {},
      },
    },
  );
  console.log(ast);

  const generateCode = generate(
    ast,
    { ...options },
  );
  // console.log(generateCode.code);
  return generateCode;
}
