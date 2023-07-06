import {
  isString,
} from '../../shared/src/general.js';
import { baseParser } from './parser.js';
import { transform } from './transform.js';
import { transformIf } from './transforms/vIf.js';
import { transformText } from './transforms/transformText.js';
import { transformElement } from './transforms/transformElement.js';

import { transformBind } from './transforms/vBind.js';
import { transformOn } from './transforms/vOn.js';
import { transformModel } from './transforms/vModel.js';

import { generate } from './codegen.js';
import { createObjectExpression } from './ast.js';

export function getBaseTransformPreset() {
  return [
    [
      transformIf,
      transformElement,
      transformText,
    ],
    {
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
  console.log(generateCode.code);
  return generateCode;
}