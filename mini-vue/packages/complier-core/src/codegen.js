import {
  isString,
  isSymbol,
} from '../../shared/src/general.js';
import {
  CREATE_COMMENT,
  CREATE_ELEMENT_VNODE,
  CREATE_STATIC,
  CREATE_TEXT,
  CREATE_VNODE,
  TO_DISPLAY_STRING,
  helperNameMap,
  WITH_DIRECTIVES,
} from './runtimeHelpers.js';
import {
  NodeTypes,
  getVNodeBlockHelper,
  getVNodeHelper,
} from './ast.js';
import { isSimpleIdentifier } from './utils.js';

const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;

function createCodegenContext(ast, {
  mode = 'function',
  prefixIdentifiers = mode === 'modlue',
  sourceMap = false,
  filename = 'template.vue.html',
  scopeId = null,
  optimizeImports = false,
  runtimeGlobaName = 'Vue',
  runtimeModuleName = 'Vue',
  ssr = false,
  inSSR = false,
}) {
  const context = {
    mode,
    prefixIdentifiers,
    sourceMap,
    filename,
    scopeId,
    optimizeImports,
    runtimeModuleName,
    runtimeGlobaName,
    ssr,
    source: ast.loc.source,
    code: '',
    column: 1,
    line: 1,
    offset: 0,
    pure: false,
    indentLevel: 0,
    map: undefined,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code, node) {
      context.code += code;
    },
    indent() {
      newline(++context.indentLevel);
    },
    deindent(withoutNewLine = false) {
      if (withoutNewLine) {
        --context.indentLevel;
      } else {
        newline(--context.indentLevel);
      }
    },
    newline() {
      newline(context.indentLevel);
    },
  };

  function newline(n) {
    context.push(`\n${' '.repeat(n)}`);
  }
  function addMapping(loc, name) {
    context.map.addMapping({
      name,
      source: context.filename,
      original: {
        line: loc.line,
        column: loc.column - 1,
      },
      generated: {
        line: context.line,
        column: context.column - 1,
      },
    });
  }

  return context;
}
export function generate(
  ast,
  options,
) {
  const context = createCodegenContext(ast, options);
  if (options.onContextCreated) {
    options.onContextCreated(context);
  }

  const {
    mode,
    push,
    prefixIdentifiers,
    indent,
    deindent,
    newline,
    scopeId,
    ssr,
  } = context;

  const helpers = Array.from(ast.helpers);
  const hasHelpers = helpers.length > 0;
  const useWithBlock = !prefixIdentifiers && mode !== 'module';
  const genScopeId = false;
  const isSetupInlined = false;
  const preambleContext = isSetupInlined ? createCodegenContext(ast, options) : context;

  genFunctionPreamble(ast, preambleContext);

  const functionName = ssr ? 'ssrRender' : 'render';
  const args = ssr ? [] : ['_ctx', '_cache'];
  const signature = args.join(', ');

  if (isSetupInlined) {
    push(`(${signature})=>{`);
  } else {
    push(`function ${functionName}(${signature}){`);
  }
  indent();
  if (useWithBlock) {
    push('with (_ctx) {');
    indent();

    if (hasHelpers) {
      push(`const { ${helpers.map(aliasHelper).join(', ')} } = _Vue`);
      push('\n');
      newline();
    }
  }

  if (ast.components.length) {
    genAssets(ast.components, 'component', context);
    if (ast.directives.length || ast.temps > 0) {
      newline();
    }
  }
  if (ast.directives.length) {
    genAssets(ast.directives, 'directives', context);
    if (ast.temps > 0) {
      newline();
    }
  }
  if (ast.temps > 0) {
    push('let ');
    for (let i = 0; i < ast.temps; i++) {
      push(`${i > 0 ? ', ' : ''}_temp${i}`);
    }
  }
  if (ast.components.length || ast.directives.length || ast.temps) {
    push('\n');
    newline();
  }
  if (!ssr) {
    push('return ');
  }
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context);
  } else {
    push('null');
  }
  if (useWithBlock) {
    deindent();
    push('}');
  }
  deindent();
  push('}');

  return {
    ast,
    code: context.code,
    preamble: isSetupInlined ? preambleContext.code : '',
    map: context.map ? context.map.toJSON() : undefined,
  };
}
function genFunctionPreamble(ast, context) {
  const {
    ssr,
    prefixIdentifiers,
    push,
    newline,
    runtimeGlobaName,
    runtimeModuleName,
  } = context;
  const VueBinding = runtimeGlobaName;
  const helpers = Array.from(ast.helpers);
  if (helpers.length > 0) {
    push(`const _Vue = ${VueBinding}\n`);

    if (ast.hoists.length) {
      const staticHelpers = [
        CREATE_VNODE,
        CREATE_ELEMENT_VNODE,
        CREATE_COMMENT,
        CREATE_TEXT,
        CREATE_STATIC,
      ].filter((helper) => helpers.includes(helper)).map(aliasHelper).join(', ');
      push(`const {${staticHelpers}} = _Vue\n`);
    }
  }
  genHoists(ast.hoists, context);
  newline();
  push('return ');
}
function genHoists(hoists, context) {
  if (!hoists.length) {

  }
}

function genNodeList(nodes, context, multilines, comma = true) {
  const { push, newline } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else if (Array.isArray(node)) {
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      if (multilines) {
        comma && push(',');
        newline();
      } else {
        comma && push(', ');
      }
    }
  }
}
function genNodeListAsArray(nodes, context) {
  const multilines = nodes.length > 3;
  context.push('[');
  multilines && context.indent();
  genNodeList(nodes, context, multilines);
  multilines && context.deindent();
  context.push(']');
}

function genNode(node, context) {
  if (isString(node)) {
    context.push(node);
    return;
  }
  if (isSymbol(node)) {
    context.push(context.helper(node));
  }
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      genNode(node.codegenNode, context);
      break;
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.TEXT_CALL:
      genNode(node.codegenNode, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context);
      break;
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context);
      break;
    case NodeTypes.JS_ARRAY_EXPRESSION:
      genArrayExpression(node, context);
      break;
    case NodeTypes.JS_FUNCTION_EXPRESSION:
      genFunctionExpression(node, context);
      break;
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context);
      break;
    case NodeTypes.JS_CACHE_EXPRESSION:
      genCacheExpression(node, context);
      break;
    case NodeTypes.JS_BLOCK_STATEMENT:
      genNodeList(node.body, context, true, false);
      break;
    case NodeTypes.IF_BRANCH:
      break;
    default:
  }
}

function genImports(importsOptions, context) {
  if (!importsOptions.length) {
    return;
  }
  importsOptions.forEach((imports) => {
    context.push('import ');
    genNode(imports.exp, context);
    context.push(` from '${imports.path}'`);
    context.newline();
  });
}
function isText(n) {
  return (
    isString(n)
    || n.type === NodeTypes.SIMPLE_EXPRESSION
    || n.type === NodeTypes.TEXT
    || n.type === NodeTypes.INTERPOLATION
    || n.type === NodeTypes.COMPOUND_EXPRESSION
  );
}

function genText(node, context) {
  context.push(JSON.stringify(node.content), node);
}
function genExpression(node, context) {
  const { content, isStatic } = node;
  context.push(isStatic ? JSON.stringify(content) : content, node);
}
function genInterpolation(node, context) {
  const { push, helper, pure } = context;

  if (pure) {
    push('');
  }
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}
function genCompoundExpression(node, context) {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (isString(child)) {
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}
function genObjectExpression(node, context) {
  const {
    push, indent, deindent, newline,
  } = context;
  const { properties } = node;
  if (!properties.length) {
    push('{}', node);
    return;
  }
  const multilines = properties.length > 1;
  push(multilines ? '{' : '{ ');
  multilines && indent();
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    genExpressionAsPropertyKey(key, context);
    push(': ');
    genNode(value, context);
    if (i < properties.length - 1) {
      push(',');
      newline();
    }
  }
  multilines && deindent();
  push(multilines ? '}' : ' }');
}
function genExpressionAsPropertyKey(node, context) {
  const { push } = context;
  if (node.type === NodeTypes.COMPOUND_EXPRESSION) {
    push('[');
    genCompoundExpression(node, context);
    push(']');
  } else if (node.isStatic) {
    const text = isSimpleIdentifier(node.content) ? node.content : JSON.stringify(node.content);
    push(text, node);
  } else {
    push(`[${node.content}]`, node);
  }
}

function genCallExpression(node, context) {
  const { push, helper, pure } = context;
  const callee = isString(node.callee) ? node.callee : helper(node.callee);
  if (pure) {
    push('');
  }
  push(`${callee}(`, node);
  genNodeList(node.arguments, context);
  push(')');
}

function genArrayExpression(node, context) {
  genNodeListAsArray(node.elements, context);
}

function genConditionalExpression(node, context) {
  const {
    test, consequent, alternate, newline: needNewline,
  } = node;
  const {
    push, indent, deindent, newline,
  } = context;
  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    const needsParens = !isSimpleIdentifier(test.content);
    needsParens && push('(');
    genExpression(test, context);
    needsParens && push(')');
  } else {
    push('(');
    genNode(test, context);
    push(')');
  }
  needNewline && indent();
  context.indentLevel++;
  needNewline || push(' ');
  push('? ');
  genNode(consequent, context);
  context.indentLevel--;
  needNewline && newline();
  needNewline || push(' ');
  push(': ');
  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION;
  if (!isNested) {
    context.indentLevel++;
  }
  genNode(alternate, context);
  if (!isNested) {
    context.indentLevel--;
  }
  needNewline && deindent(true /* without newline */);
}
function genCacheExpression(node, context) {
  const {
    push, helper, indent, deindent, newline,
  } = context;
  push(`_cache[${node.index}] || (`);
  if (node.isVNode) {
    indent();
    push(`${helper(SET_BLOCK_TRACKING)}(-1),`);
    newline();
  }
  push(`_cache[${node.index}] = `);
  genNode(node.value, context);
  if (node.isVNode) {
    push(',');
    newline();
    push(`${helper(SET_BLOCK_TRACKING)}(1),`);
    newline();
    push(`_cache[${node.index}]`);
    deindent();
  }
  push(')');
}

function genVNodeCall(node, context) {
  const { push, helper, pure } = context;
  const {
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent,
  } = node;
  if (directives) {
    push(`${helper(WITH_DIRECTIVES)}(`);
  }
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? 'true' : ''}), `);
  }
  if (pure) {
    push(PURE_ANNOTATION);
  }
  const callHelper = isBlock
    ? getVNodeBlockHelper(context.inSSR, isComponent)
    : getVNodeHelper(context.inSSR, isComponent);

  push(`${helper(callHelper)}(`, node);

  genNodeList(
    genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
    context,
  );
  push(')');
  if (isBlock) {
    push(')');
  }
  if (directives) {
    push(', ');
    genNode(directives, context);
    push(')');
  }
}

function genNullableArgs(args) {
  let i = args.length;
  while (i--) {
    if (args[i] != null) break;
  }
  return args.slice(0, i + 1).map((arg) => arg || 'null');
}
