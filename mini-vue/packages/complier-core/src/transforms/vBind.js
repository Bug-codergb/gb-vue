import { NodeTypes, createObjectProperty, createSimpleExpression } from '../ast.js';

export const transformBind = (dir, _node, context) => {
  const { exp, modifiers, loc } = dir;
  const { arg } = dir;
  if (arg.type !== NodeTypes.SIMPLE_EXPRESSION) { // 为什么不是simple_expression

  } else if (!arg.isStatic) {
    arg.content = `${arg.content} || ""`;
  }

  if (!exp || (exp.type === NodeTypes.SIMPLE_EXPRESSION && !exp.content.trim())) {
    console.error('error');
    return {
      props: [createObjectProperty(arg, createSimpleExpression('', true, loc))],
    };
  }
  return {
    props: [createObjectProperty(arg, exp)],
  };
};
