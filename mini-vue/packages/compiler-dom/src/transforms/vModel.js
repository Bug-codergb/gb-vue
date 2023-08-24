import { ElementTypes, NodeTypes } from '../../../compiler-core/src/ast.js';
import { transformModel as baseTransform } from '../../../compiler-core/src/transforms/vModel.js';
import { findProp, hasDynamicKeyVBind } from '../../../compiler-core/src/utils.js';
import {
  V_MODEL_CHECKBOX,
  V_MODEL_DYNAMIC,
  V_MODEL_RADIO,
  V_MODEL_SELECT,
  V_MODEL_TEXT,
} from '../runtimeHelpers.js';

const __DEV__ = true;
export const transformModel = (dir, node, context) => { // 这里会将compiler-core中的transformModel覆盖
  const baseResult = baseTransform(dir, node, context);// 依赖于compiler-core中的transformModel

  // 如果元素类型为组件，则直接return
  if (!baseResult.props.length || node.tagType === ElementTypes.COMPONENT) {
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
  // 判断表单元素类型
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
