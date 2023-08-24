import {
  EMPTY_OBJ, camelize, hyphenate, toHandlerKey,
} from '../../shared/src/general.js';

export function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted) return;

  const props = instance.vnode.props || EMPTY_OBJ;

  const args = rawArgs;
  const isModelListener = event.startsWith('update:');// 如果以update开头则是组件上的v-model
  const modelArg = isModelListener && event.slice(7);

  /**
   * const props = defineProps({
   *   firtName:{type:String,default:''}
   * })
   *
   * emit("update:firstName",newValue);
   */
  if (modelArg && modelArg in props) { // 如果props存在
    // 处理修饰符
  }
  let handlerName;
  let handler = props[(handlerName = toHandlerKey(event))]
    || props(handlerName = toHandlerKey(camelize(event)));// 获取父组件传过来的事件处理函数的handler

  if (!handler && isModelListener) {
    handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
  }
  if (handler) {
    handler(args);
  }
}
