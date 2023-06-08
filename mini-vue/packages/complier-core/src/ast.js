export const NodeTypes= {
  ROOT:'root',
  ELEMENT:'element',
  TEXT:'text',
  COMMENT:'comment',
  SIMPLE_EXPRESSION:'simple_expression',
  INTERPOLATION:'interpolation',
  ATTRIBUTE:'attronite',
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