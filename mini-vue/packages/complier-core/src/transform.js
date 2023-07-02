import {
  isSingleElementRoot,
} from './transforms/hoistStatic.js';
import {
  NOOP,
  isString,
  EMPTY_OBJ,
} from '../../shared/src/general.js';
import { PatchFlagNames, PatchFlags } from '../../shared/src/patchFlags.js';
import {
  NodeTypes, ElementTypes, ConstantTypes, createVNodeCall,
} from './ast.js';
import { FRAGMENT, helperNameMap, TO_DISPLAY_STRING } from './runtimeHelpers.js';

export function createTransformContext(root, {
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
  ssrCssVars = '',
  inline = false,
  isTS = false,
  bindingMetadata = EMPTY_OBJ,
}) {
  const nameMatch = filename.replace(/\?.*$/, '').match(/([^/\\]+)\.\w+$/);
  const context = {
    selfName: nameMatch && capitalize(camelize(nameMatch[1])),
    prefixIdentifiers,
    hoistStatic,
    cacheHandlers,
    nodeTransforms,
    directiveTransforms,
    transformHoist,
    isBuiltInComponent,
    isCustomElement,
    expressionPlugins,
    scopeId,
    slotted,
    ssr,
    inSSR,
    ssrCssVars,
    bindingMetadata,
    inline,
    isTS,

    root,
    helpers: new Map(),
    components: new Set(),
    directives: new Map(),
    currentNode: root,
    parent: null,
    childIndex: 0,
    hoists: [],
    imports: [],
    constantCache: new Map(),
    temps: 0,
    cached: 0,
    identifiers: Object.create(null),
    scopes: {
      vFor: 0,
      vSlot: 0,
      vPre: 0,
      vOnce: 0,
    },
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
      return `_${helperNameMap[context.helper(name)]}`;
    },
    replaceNode(node) {
      context.parent.children[context.childIndex] = context.currentNode = node;
    },
    removeNode(node) {
      const list = context.parent.children;
      const removalIndex = node ? list.indexOf(node) : context.currentNode ? context.childIndex : -1;
      if (!node || node === context.currentNode) {
        context.currentNode = null;
        context.onNodeRemoved();
      } else if (context.childIndex > removalIndex) {
        context.childIndex--;
        context.onNodeRemoved();
      }
      context.parent.children.splice(removalIndex, 1);
    },
    onNodeRemoved() {

    },
    hoist(exp) {
      if (isString(exp)) exp = createSimpleExpression(exp);
      context.hoists.push(exp);
      const identifier = createSimpleExpression(
        `_hoisted_${context.hoists.length}`,
        false,
        exp.loc,
        ConstantTypes.CAN_HOIST,
      );
      identifier.hoisted = exp;
      return identifier;
    },
    cache(exp, isVNode = false) {
      return createCacheExpression(context.cached++, exp, isVNode);
    },
  };
  return context;
}
// 这里开始
export function transform(root, options) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);

  // console.log(context.hoistStatic); false

  if (!options.ssr) {
    createRootCodegen(root, context);
  }

  root.helpers = new Set([...context.helpers.keys()]);
  root.conpoments = [...context.components];
  root.directives = [...context.directives];
  root.imports = context.imports;
  root.hoists = context.hoists;
  root.temps = context.temps;
  root.cached = context.cached;
}

function createRootCodegen(root, context) {
  const { helper } = context;
  const { children } = root;
  if (children.length === 1) {
    const child = children[0];
    if (isSingleElementRoot(root, child) && child.codegenNode) {
      const { codegenNode } = child;
      if (codegenNode.type === NodeTypes.VNODE_CALL) {

      }
      root.codegenNode = codegenNode;
    } else {
      root.codegenNode = child;
    }
  } else if (children.length > 1) {
    debugger;
    let patchFlag = PatchFlags.STABLE_FRAGMENT;
    let patchFlagText = PatchFlagNames[PatchFlags.STABLE_FRAGMENT];
    if (children.filter((c) => c.type !== NodeTypes.COMMENT).length === 1) {
      patchFlag |= PatchFlags.DEV_ROOT_FRAGMENT;
      patchFlagText += ` ${PatchFlagNames[PatchFlags.DEV_ROOT_FRAGMENT]} `;
    }
    root.codegenNode = createVNodeCall(
      context,
      helper(FRAGMENT),
      undefined,
      root.children,
      `${patchFlag} /* ${patchFlagText} */`,
      undefined,
      undefined,
      true,
      undefined,
      false,
    );
  }
}

export function createStructuralDirectiveTransform(name, fn) {
  const matches = isString(name) ? (n) => n === name : (n) => name.test(n);
  return (node, context) => {
    if (node.type === NodeTypes.ELEMENT) {
      const { props } = node;
      if (node.tagType === ElementTypes.TEMPLATE) {
        return;
      }

      const exitFns = [];
      for (let i = 0; i < props.length; i++) {
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
  };
}

export function traverseNode(node, context) {
  context.currentNode = node;
  const { nodeTransforms } = context;
  const exitFns = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);// 使用 v-if,v-on,v-for,或者transformText,tranformElement处理节点
    if (onExit) {
      if (Array.isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }
    if (!context.currentNode) {
      return;
    }
    node = context.currentNode;
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      if (!context.ssr) {
        context.helper(TO_DISPLAY_STRING);
      }
      break;
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
export function traverseChildren(parent, context) {
  let i = 0;
  const nodeRemoved = () => {
    i--;
  };
  for (; i < parent.children.length; i++) {
    const child = parent.children[i];

    if (isString(child)) continue;
    context.parent = parent;
    context.childIndex = i;
    context.onNodeRemoved = nodeRemoved;
    traverseNode(child, context);
  }
}
