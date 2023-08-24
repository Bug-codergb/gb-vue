import { camelize } from '../../../shared/src/general.js';
import {
  NodeTypes, createCompoundExpression, createObjectProperty, createSimpleExpression,
} from '../ast.js';
import { isStaticExp } from '../utils.js';
/*
  v-model:firstName="app"
  exp = {content:app},
  arg = {content:firstName}
*/
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
/**
 * 父组件
 * <div>
 *   {{app}}
 *   <Comp v-model:firstName="app"/>
 * </div>
 * <script>
 *   const app = ref("今天是个好日子")
 * </script>
 *
 * 子组件 (Comp)
 *  <div>
 *    {{firstName}}
 *    <input v-model="text"/>
 *  </div>
 *  <script>
 *    const props = defineProps({
 *      firstName:{},
 *    })
 *    const emit = defineEmits(['update:firstName'])
 *
 *    const text = computed({
 *     get(){
 *       return props.firstName,
 *     },
 *     set(newValue){
 *       emit("update:firstName",newValue)
 *     }
 *   })
 *  </script>
 *
 *  1. 经过模板编译后父组件相关v-model变为 vnode.props={ onUpdate:firstName : $event => app.value = $event }
 *  2. 经过模板编译后自组件相关v-model变为 vnode.props={ onUpdate:modelValue : $event => text.value = $event }
 *  3. 当用户在input输入后，调用计算属性的set方法，调用emit， 会调用vnode.props[update:firstName]()
 *  4. 调用vnode.props[update:firstName]()后，将newValue传给$event=>app.value=$event, 将用户输入传给app
 *  5. 至于firstName,v-model存在与组件上的时候，会将其arg传给props
 */
