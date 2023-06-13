import {
  isString
} from "../../shared/src/general.js";
import { NodeTypes, ElementTypes } from "./ast.js";

export function createTransformContext(root,{
  filename = '',
  prefixIdentifiers = false,
  hoistStatic = false,
  cacheHandlers = false,
  nodeTransforms = [],
  directiveTransforms = {},
  transformHoist = null,
  isBuiltInComponent = NOOP,
  isCustomElement = NOOP,
  expressionPlugins = [],
  scopeId = null,
  slotted = true,
  ssr = false,
  inSSR = false,
  ssrCssVars = ``,
  bindingMetadata = EMPTY_OBJ,
  inline = false,
  isTS = false,
  onError = defaultOnError,
  onWarn = defaultOnWarn,
  compatConfig
}) {
  const context = {
    nodeTransforms,
    directiveTransforms,
    root,
    helpers: new Map(),
    directives: new Map(),
    currentNode: root,
    parent: null,
    childIndex: 0,
    
  }
}

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

export function traverseNode(node,context) {
  context.currentNode = node;
  const { nodeTransforms } = context;
  for (let i = 0; i < nodeTransforms.length; i++){
    const onExit = nodeTransforms[i](node, context);//使用 v-if,v-on,v-for,或者transformText,tranformElement处理节点

  }
}