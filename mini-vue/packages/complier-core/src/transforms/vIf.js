import { createSimpleExpression } from "../ast.js";
import { 
  createStructuralDirectiveTransform
} from "../transform.js";
export const transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, (node, dir, context) => {
  //返回processIf的调用
  return processIf();
});
export function processIf(node, dir, context, processCodegen) {
  // v-if 或者 v-else-if 没有value, v-if=undefined
  if (dir.name !== 'else' && (!dir.exp || !dir.exp.content.trim())) {
    const loc = fir.exp ? dir.exp.loc : node.loc;
    dir.exp = createSimpleExpression('true',false,loc);
  }
}