import { camelize } from '../../../shared/src/general.js';
import {
  NodeTypes, createCompoundExpression, createObjectProperty, createSimpleExpression,
} from '../ast.js';
import { isStaticExp } from '../utils.js';

export const transformModel = (dir, node, context) => {
  const { exp, arg } = dir;
  // 获取指令对应的argument,expression,指令结构 https://cn.vuejs.org/guide/essentials/template-syntax.html#directives
  if (!exp) {
    console.error('v-model不存在表达式');// 不存在表达式则报错
    return;
  }
  const rawExp = exp.loc.source;
  // 获取v-mdoel的绑定值 v-model="app", app则为expString
  const expString = exp.type === NodeTypes.SIMPLE_EXPRESSION ? exp.content : rawExp;

  // 获取argument，如果argument不存在，则为null,否则设置modelValue
  const propName = arg || createSimpleExpression('modelValue', true);
  const eventName = arg ? isStaticExp(arg)
    ? `onUpdate:${camelize(arg.content)}`
    : createCompoundExpression(['"onUpdate:" + ', arg]) : 'onUpdate:modelValue';
  /*
    所发出的事件名称，arg不存在则为onUpdate:modelValue,
    arg存在且为静态属性则，arg为onUpdate:app
    arg存在且为动态属性则，arg为onUpdate:[app]
  * */
  let assignmentExp;
  const eventArg = '$event';

  assignmentExp = createCompoundExpression([
    `${eventArg} => ((`,
    exp,
    ') = $event)',
  ]);

  /**
   * example v-model:demon="app"
   *  modelValue = app
   *  onUpdate:demon = ($event)=>(app=$event)
   */
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
