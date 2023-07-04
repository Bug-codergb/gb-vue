import { hyphenate } from '../../../shared/src/general.js';

export function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
export function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
export function patchEvent(
  el,
  rawName,
  prevValue,
  nextValue,
  instance,
) {
  const invokers = el._vei || (el._vei = {});// 创建一个invokers
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {

  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
      console.log(invoker);
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = undefined;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {

  }
  const event = name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2));
  return [event, options];
}
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    const fn = patchStopImmediatePropagation(e, invoker.value);
    console.log(fn);
    fn(...[e]);
  };
  invoker.value = initialValue;
  return invoker;
}

function patchStopImmediatePropagation(e, value) {
  if (Array.isArray(value)) {

  } else {
    return value;
  }
}
