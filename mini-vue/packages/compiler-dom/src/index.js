import { baseComplie } from '../../compiler-core/src/index.js';
import { parserOptions } from './parserOptions.js';

import { transformStyle } from './transforms/transformStyle.js';
import { transformModel } from './transforms/vModel.js';
import { transformOn } from './transforms/vOn.js';
import { transformShow } from './transforms/vShow.js';

export const DOMNodeTransforms = [
  transformStyle,
];

export const DOMDirectiveTransforms = {
  model: transformModel,
  on: transformOn,
  show: transformShow,
};

export function complie(template, options) {
  return baseComplie(template, {
    ...parserOptions,
    ...options,
    nodeTransforms: [
      ...DOMNodeTransforms,
    ],
    directiveTransforms: {

      ...DOMDirectiveTransforms,
      ...options.directiveTransforms || {},
    },
  });
}

export * from '../../compiler-core/src/index.js';
