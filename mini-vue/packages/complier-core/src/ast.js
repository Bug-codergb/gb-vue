import { isString } from "../../shared/src/general.js";

export const NodeTypes= {
  ROOT:'root',
  ELEMENT:'element',
  TEXT:'text',
  COMMENT:'comment',
  SIMPLE_EXPRESSION:'simple_expression',
  INTERPOLATION:'interpolation',
  ATTRIBUTE:'attribute',
  DIRECTIVE:'directive',
  // containers
  COMPOUND_EXPRESSION:'compound_expression',
  IF:'if',
  IF_BRANCH:'if_branch',
  FOR:'for',
  TEXT_CALL:'text_call',
  // codegen
  VNODE_CALL:'vnode_call',
  JS_CALL_EXPRESSION:'ja_call_expression',
  JS_OBJECT_EXPRESSION:'js_object_expression',
  JS_PROPERTY:'js_property',
  JS_ARRAY_EXPRESSION:'js_array_expression',
  JS_FUNCTION_EXPRESSION:'js_function_expression',
  JS_CONDITIONAL_EXPRESSION:'js_conditional_expression',
  JS_CACHE_EXPRESSION:'js_cache_expression',

  // ssr codegen
  JS_BLOCK_STATEMENT:'js_block_statement',
  JS_TEMPLATE_LITERAL:'js_template_literal',
  JS_IF_STATEMENT:'js_if_statement',
  JS_ASSIGNMENT_EXPRESSION:"js_assignment_expression",
  JS_SEQUENCE_EXPRESSION:'js_sequence_expression',
  JS_RETURN_STATEMENT:'js_return_statement'
}

export const ElementTypes ={
  ELEMENT:'element',
  COMPONENT:'component',
  SLOT:'slot',
  TEMPLATE:'template'
}

export const Namespaces ={
  HTML:0
}
export const ConstantTypes = {
  NOT_CONSTANT : 0,
  CAN_SKIP_PATCH : 1,
  CAN_HOIST : 2,
  CAN_STRINGIFY : 3
}
export function createRoot(children,loc) {
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
    loc
  }
}
export function createSimpleExpression(content,isStatic,loc,constType) {
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    loc,
    content,
    isStatic,
    constType : isStatic ? ConstantTypes.CAN_STRINGIFY :constType
  }
}
export function createCompoundExpression(children,loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children
  }
}

export function createObjectExpression(
  properties,
  loc={}
) {
  return {
    type: NodeTypes.JS_OBJECT_EXPRESSION,
    loc,
    properties
  }
}

export function createObjectProperty(key,value) {
  return {
    type: NodeTypes.JS_PROPERTY,
    loc: {},
    key: isString(key) ? createSimpleExpression(key, true) : key,
    value
  }
}
export function createCallExpression(callee,args,loc) {
  return {
    type: NodeTypes.JS_CACHE_EXPRESSION,
    loc,
    callee,
    arguments:args
  }
}
export function createArrayExpression(elements,loc){
  return {
    type: NodeTypes.JS_ARRAY_EXPRESSION,
    loc,
    elements
  }
}