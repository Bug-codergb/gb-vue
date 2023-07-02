import { NodeTypes } from '../../../complier-core/src/ast.js';
import { transformModel as baseTransform } from '../../../complier-core/src/transforms/vModel.js';
import { findProp, hasDynamicKeyVBind } from '../../../complier-core/src/utils.js';
import {
  V_MODEL_CHECKBOX,
  V_MODEL_DYNAMIC,
  V_MODEL_RADIO,
  V_MODEL_SELECT,
  V_MODEL_TEXT,
} from '../runtimeHelpers.js';

const __DEV__ = true;
export const transformModel = (dir, node, context) => {
  const baseResult = baseTransform(dir, node, context);

  if (!baseResult.props.length) {
    return baseResult;
  }

  if (dir.arg) {
    console.error('v-model不应该存在arg');
  }
  function checkDuplicatedValue() {
    const value = findProp(node, 'value');
    if (value) {
      console.error('v-model error');
    }
  }
  const { tag } = node;
  if (
    tag === 'input' || tag === 'textarea'
    || tag === 'select'
  ) {
    let directiveToUse = V_MODEL_TEXT;
    let isInvalidType = false;
    if (tag === 'input') {
      const type = findProp(node, 'type');
      if (type) {
        if (type.type === NodeTypes.DIRECTIVE) {
          directiveToUse = V_MODEL_DYNAMIC;
        } else if (type.value) {
          switch (type.value.content) {
            case 'radio':
              directiveToUse = V_MODEL_RADIO;
              break;
            case 'checkbox':
              directiveToUse = V_MODEL_CHECKBOX;
              break;
            case 'file':
              isInvalidType = true;// 当input的<input type="file"/>不可以使用v-model
              break;
            default:
              __DEV__ && checkDuplicatedValue();
              break;
          }
        }
      } else if (hasDynamicKeyVBind(node)) {
        directiveToUse = V_MODEL_DYNAMIC;
      } else {
        __DEV__ && checkDuplicatedValue();
      }
    } else if (tag === 'select') {
      directiveToUse = V_MODEL_SELECT;
    } else {
      __DEV__ && checkDuplicatedValue();
    }
    if (!isInvalidType) {
      baseResult.needRuntime = context.helper(directiveToUse);
    }
  } else {
    console.error('v-model on on validate element');
  }

  baseResult.props = baseResult.props.filter(
    (p) => !(
      p.key.type === NodeTypes.SIMPLE_EXPRESSION
      && p.key.content === 'modelValue'
    ),
  );
  return baseResult;
};
