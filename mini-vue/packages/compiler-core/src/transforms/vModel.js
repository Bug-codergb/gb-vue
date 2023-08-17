import { camelize } from '../../../shared/src/general.js';
import {
  NodeTypes, createCompoundExpression, createObjectProperty, createSimpleExpression,
} from '../ast.js';
import { isStaticExp } from '../utils.js';

export const transformModel = (dir, node, context) => {
  const { exp, arg } = dir;
  if (!exp) {
    console.error('v-model不存在表达式');
  }
  const rawExp = exp.loc.source;
  console.log(rawExp);
  const expString = exp.type === NodeTypes.SIMPLE_EXPRESSION ? exp.content : rawExp;

  const propName = arg || createSimpleExpression('modelValue', true);
  const eventName = arg ? isStaticExp(arg)
    ? `onUpdate:${camelize(arg.content)}`
    : createCompoundExpression(['"onUpdate:" + ', arg]) : 'onUpdate:modelValue';
  console.log(eventName);
  let assignmentExp;
  const eventArg = '$event';

  assignmentExp = createCompoundExpression([
    `${eventArg} => ((`,
    exp,
    ') = $event)',
  ]);
  const props = [
    createObjectProperty(propName, dir.exp),
    createObjectProperty(eventName, assignmentExp),
  ];
  /*
    modelValue 就是v-model绑定的值
    onUpdate:modelValue :发出的事件
  */
  return createTransformProps(props);
};
function createTransformProps(props = []) {
  return {
    props,
  };
}
