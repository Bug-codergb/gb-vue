import {
  ElementTypes,
  NodeTypes,
  createCompoundExpression,
  createObjectProperty,
  createSimpleExpression,
} from '../ast.js';
import {
  toHandlerKey,
  camelize,
} from '../../../shared/src/general.js';
import { TO_HANDLER_KEY } from '../runtimeHelpers.js';

const fnExpRE = /^\s*([\w$_]+|(async\s*)?\([^)]*?\))\s*(:[^=]+)?=>|^\s*(async\s+)?function(?:\s+[\w$]+)?\s*\(/;

export const transformOn = (dir, node, context, augmentor) => {
  const { loc, modifiers, arg } = dir;
  if (!dir.exp && !modifiers.length) {
    console.error('error');// v-on表达式不存在时
  }
  let eventName;
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      let rawName = arg.content;
      if (rawName.startsWith('vue:')) {
        rawName = `vnode-${rawName.slice(4)}`;
      }
      const eventString = node.tagType !== ElementTypes.ELEMENT || rawName.startsWith('vnode')
        || !/[A-Z]/.test(rawName)
        ? toHandlerKey(camelize(rawName))
        : `on:${rawName}`;
      eventName = createSimpleExpression(eventString, true, arg.loc);
    } else {
      eventName = createCompoundExpression([
        `${context.helperString(TO_HANDLER_KEY)}(`,
        arg,
        ')',
      ]);
    }
  } else {
    eventName = arg;
    eventName.children.unshift(`${context.helperString(TO_HANDLER_KEY)}(`);
    eventName.children.push(')');
  }
  console.log(eventName);
  let { exp } = dir;
  if (exp && !exp.content.trim()) {
    exp = undefined;
  }
  const shouldCache = context.cacheHandlers && !exp && context.inVOnce;

  if (exp) {
    const isMemberExp = false;
    const isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content));
    const hasMultipleStatements = exp.content.includes(';');
    if (isInlineStatement || (shouldCache && isMemberExp)) {
      exp = createCompoundExpression([
        `${
          isInlineStatement ? '$event' : '(...args)'
        }=>${hasMultipleStatements ? '{' : '('}`,
        exp,
        hasMultipleStatements ? '}' : ')',
      ]);
    }
  }

  let ret = {
    props: [
      createObjectProperty(
        eventName,
        exp || createSimpleExpression('()=>{}', false, loc),
      ),
    ],
  };
  if (augmentor) {
    ret = augmentor(ret);
  }
  console.log(ret)
  ret.props.forEach((p) => (p.key.isHandlerKey = true));
  return ret;
};
