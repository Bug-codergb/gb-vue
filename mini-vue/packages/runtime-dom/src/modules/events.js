import { hyphenate } from '../../../shared/src/general.js';
export function addEventListener(el, event, handler, options) {
  el.addEventListener(event, handler, options);
}
export function removeEventListener(el, event, handler, options) {
  el.removeEventListener(event, handler, options);
}
/**
 * 进行patchEvent时，为了提高性能，当事件绑定的处理函数发生改变时，不会先移除之前的事件处理函数再进行绑定
 * 而是通过向当前el(真实dom上添加一个对象invokers),invokers上不同的健表示不同的事件名称：如invokers['click'],
 * 将事件对应的处理函数复制给invokers['click']的value属性，如invokers['click'].value,最后的绑定形式为
 *  invokers[key]=(e)=>{
 *    invokers[key].value();
 *  }
 */
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
    // 也可以使用e自身的timestamp
    if (!e.vts) {
      e.vts = Date.now();
    } else if (e.vts <= invoker.attached) { // 如果事件处理函数的执行时间小于时间函数的绑定时间（冒泡在update后执行）则不执行时间处理函数
      // 详情见根目录下的test
      return;
    }
    const fn = patchStopImmediatePropagation(e, invoker.value);
    fn(...[e]);
  };
  invoker.value = initialValue;
  invoker.attached = Date.now();
  return invoker;
}

function patchStopImmediatePropagation(e, value) {
  if (Array.isArray(value)) {

  } else {
    return value;
  }
}
