import { transformModel as baseTransform } from "../../../complier-core/src/transforms/vModel.js";
import { findProp } from "../../../complier-core/src/utils.js";
export const transformModel = (dir,node,context) => {
  const baseResult = baseTransform(dir, node, context);
  if (!baseResult.props.length) {
    return baseResult;
  }
  if (!dir.arg) {
    console.error("v-model");
  }
  function checkDuplicatedValue() {
    
  }
}