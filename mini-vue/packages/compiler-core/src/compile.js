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

import { transformExpression } from './transforms/transformExpression.js';

import { trackSlotScoped } from './transforms/vSlot.js';
import { generate } from './codegen.js';

export function getBaseTransformPreset() { // 转换所需预设
  return [
    [
      transformIf, // 处理v-if指令
      transformFor, // 处理v-for指令
      // transformExpression,
      transformSlotOutlet, // 用于处理<slot></slot>标签
      transformElement, // 核心，用于处理元素节点
      trackSlotScoped,
      transformText, // 用于处理文本节点
    ],
    { // 转换时指令的处理方法，如果compiler-dom传入则会覆盖，但是compiler-dom中的transform会依赖于这里的transform
      on: transformOn, // v-on指令处理
      bind: transformBind, // v-bind指令处理
      model: transformModel, // v-model指令处理
    },
  ];
}
export function baseComplie(template, options) {
  const isModuleMode = options.mode === 'module';
  // ast转化阶段，将模板转化为抽象语法树
  const ast = isString(template) ? baseParser(template, options) : template;

  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();

  const prefixIdentifiers = false;
  // transform阶段（难点）
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
  // 生成render函数阶段
  const generateCode = generate(
    ast,
    Object.assign({}, options, {
      prefixIdentifiers,
    }),
  );
  console.log(generateCode.code);
  return generateCode;
}
