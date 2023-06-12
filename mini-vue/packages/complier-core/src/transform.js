import {
  isString
} from "../../shared/src/general.js";
import { NodeTypes,ElementTypes } from "./ast.js";
export function transform(root, options) {
  
}
export function createStructuralDirectiveTransform(name,fn) {
  const matches = isString(name) ? (n) => n === name : (n) => name.test(n);
  return (node,context) => {
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node;
      if (node.tagType === ElementTypes.TEMPLATE) {
        return;
      }

      const exitFns = [];
      for (let i = 0; i < props.length; i++){
        const prop = props[i];
        if (prop.type === NodeTypes.DIRECTIVE && matches(prop.name)) {
          // why?
          props.splice(i, 1);
          i--;

          const onExit = fn(node, prop, context);
          
          if (onExit) {
            exitFns.push(onExit);
          }
        }
      }
      return exitFns;
    }
  }
}