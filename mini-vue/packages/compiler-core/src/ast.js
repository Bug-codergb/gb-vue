import { isString } from '../../shared/src/general.js';
import {
  CREATE_BLOCK,
  CREATE_ELEMENT_BLOCK,
  OPEN_BLOCK,
  WITH_DIRECTIVES,
  CREATE_VNODE,
  CREATE_ELEMENT_VNODE,
} from './runtimeHelpers.js';

export const NodeTypes = {
  ROOT: 'root',
  ELEMENT: 'element',
  TEXT: 'text',
  COMMENT: 'comment',
  SIMPLE_EXPRESSION: 'simple_expression',
  INTERPOLATION: 'interpolation',
  ATTRIBUTE: 'attribute',
  DIRECTIVE: 'directive',
  // containers
  COMPOUND_EXPRESSION: 'compound_expression',
  IF: 'if',
  IF_BRANCH: 'if_branch',
  FOR: 'for',
  TEXT_CALL: 'text_call',
  // codegen
  VNODE_CALL: 'vnode_call',
  JS_CALL_EXPRESSION: 'ja_call_expression',
  JS_OBJECT_EXPRESSION: 'js_object_expression',
  JS_PROPERTY: 'js_property',
  JS_ARRAY_EXPRESSION: 'js_array_expression',
  JS_FUNCTION_EXPRESSION: 'js_function_expression',
  JS_CONDITIONAL_EXPRESSION: 'js_conditional_expression',
  JS_CACHE_EXPRESSION: 'js_cache_expression',

  // ssr codegen
  JS_BLOCK_STATEMENT: 'js_block_statement',
  JS_TEMPLATE_LITERAL: 'js_template_literal',
  JS_IF_STATEMENT: 'js_if_statement',
  JS_ASSIGNMENT_EXPRESSION: 'js_assignment_expression',
  JS_SEQUENCE_EXPRESSION: 'js_sequence_expression',
  JS_RETURN_STATEMENT: 'js_return_statement',
};

export const ElementTypes = {
  ELEMENT: 'element',
  COMPONENT: 'component',
  SLOT: 'slot',
  TEMPLATE: 'template',
};

export const Namespaces = {
  HTML: 0,
};
export const ConstantTypes = {
  NOT_CONSTANT: 0,
  CAN_SKIP_PATCH: 1,
  CAN_HOIST: 2,
  CAN_STRINGIFY: 3,
};
// 当不需要和模板关联时，位置信息只做一个存根，无实际意义（如条件表达式）
export const locSub = {
  source: '',
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 1, column: 1, offset: 0 },
};
export function createRoot(children, loc) {
  return {
    type: NodeTypes.ROOT,
    children,
    helpers: new Set(),
    components: [],
    directives: [],
    hoists: [],
    imports: [],
    cached: 0,
    temps: 0,
    codegenNode: undefined,
    loc,
  };
}
export function createSimpleExpression(content, isStatic, loc, constType) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    content,
    isStatic,
    constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType,
  };
}
export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children,
  };
}

export function createObjectExpression(
  properties,
  loc = {},
) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc,
    properties,
  };
}

export function createObjectProperty(key, value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value,
  };
}
export function createCallExpression(callee, args, loc) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    loc,
    callee,
    arguments: args,
  };
}
export function createArrayExpression(elements, loc) {
  return {
    type: NodeTypes.JS_ARRAY_EXPRESSION,
    loc,
    elements,
  };
}
// 创建分支节点
/*
  test:条件，
  consequent:条件满足时执行，
  alternate:条件不满足时执行
*/
export function createConditionalExpression(
  test,
  consequent,
  alternate,
  newline = true,
) {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
    newline,
    loc: {},
  };
}
export function createVNodeCall(
  context,
  tag,
  props,
  children,
  patchFlag,
  dynamicProps,
  directives,
  isBlock,
  disableTracking,
  isComponent,
  loc = {},
) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK);
      context.helper(getVNodeBlockHelper(context.inSSR, isComponent));
    } else {
      context.helper(getVNodeHelper(context.inSSR, isComponent));
    }
    if (directives) {
      context.helper(WITH_DIRECTIVES);
    }
  }

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
    isComponent,
    loc,
  };
}
export function getVNodeHelper(ssr, isComponent) {
  return ssr || isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}

export function getVNodeBlockHelper(ssr, isComponent) {
  return ssr || isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK;
}

export function convertToBlock(node, { helper, removeHelper, inSSR }) {
  if (!node.isBlock) {
    node.isBlock = true;
    removeHelper(getVNodeHelper(inSSR, node.isComponent));
    helper(OPEN_BLOCK);
    helper(getVNodeBlockHelper(inSSR, node.isComponent));
  }
}
