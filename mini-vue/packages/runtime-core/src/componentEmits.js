import {
  EMPTY_OBJ, camelize, hyphenate, toHandlerKey,
} from '../../shared/src/general.js';

export function emit(instance, event, ...rawArgs) {
  if (instance.isUnmounted) return;

  const props = instance.vnode.props || EMPTY_OBJ;

  const args = rawArgs;
  const isModelListener = event.startsWidth('update:');
  const modelArg = isModelListener && event.slice(7);
  let handlerName;
  let handler = props[(handlerName = toHandlerKey(event))]
    || props(handlerName = toHandlerKey(camelize(event)));

  if (!handler && isModelListener) {
    handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
  }
  if (handler) {
    handler(args);
  }
}
