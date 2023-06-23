import {
  NOOP,
  isString
} from "../../shared/src/general.js";
import { NodeTypes, ElementTypes } from "./ast.js";
import { helperNameMap } from "./runtimeHelpers.js";

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
  inline = false,
  isTS = false,
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
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
      return name;
    },
    removeHelper(name) {
      const count = context.helpers.get(name);
      if (count) {
        const currentCount = count - 1;
        if (!currentCount) {
          context.helpers.delete(name);
        } else {
          context.helpers.set(name, currentCount);
        }
      }
    },
    helperString(name) {
      returnn `_${helperNameMap[context.helper(name)]}`
    },
    replaceNode(node) {
      context.parent.children[context.childIndex] = context.currentNode = node;
    },
    removeNode(node) {
      const list = context.parent.children;
      const removalIndex = node ? list.indexOf(node) : context.currentNode ? context.childIndex : -1;
      if (!node || node === context.currentNode) {
        context.currentNode = null;
        context.onNodeRemoved()
      } else {
        if (context.childIndex > removalIndex) {
          context.childIndex--;
          context.onNodeRemoved();
        }
      }
      context.parent.children.splice(removalIndex, 1);
    },
    onNodeRemoved() {
      
    }
  }
  return context;
}
//这里开始
export function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root,context);
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

export function traverseNode(node, context) {
  context.currentNode = node;
  const { nodeTransforms } = context;
  const exitFns = [];
  for (let i = 0; i < nodeTransforms.length; i++){
    const onExit = nodeTransforms[i](node, context);//使用 v-if,v-on,v-for,或者transformText,tranformElement处理节点
    if (onExit) {
      if (Array.isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      return;
    } else {
      node = context.currentNode;
    }
  }
  
  switch (node.type) {
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context);
      }
      break;
    case NodeTypes.IF_BRANCH:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context);
      break;
  }
  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}
export function traverseChildren(parent,context) {
  let i = 0;
  const nodeRemoved = () => {
    i--;
  }
  for (; i < parent.children.length; i++){
    const child = parent.children[i];
    
    if (isString(child)) continue;
    context.parent = parent;
    context.childIndex = i;
    context.onNodeRemoved = nodeRemoved;
    traverseNode(child, context);
  }
}