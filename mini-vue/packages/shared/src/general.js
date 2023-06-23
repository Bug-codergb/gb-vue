export const NOOP=()=>{}
export const NO = () => false
export const EMPTY_OBJ = Object.freeze({})
const onRE = /^on[^a-z]/
export const isOn = (key) => onRE.test(key)

export const isReservedProps = (key) => {
  let map = new Map([
    ['key', true],
    ['ref',true]
  ])
  return !!map.get(key);
}
export const hasChanged = (newValue,oldValue) => {
  return !Object.is(newValue, oldValue);
}
export const isString = (value) => {
  return typeof value === "string";
}
export const isIntegerKey = (key) => {
  return isString(key) && key !== NaN && '' + parseInt(key, 10) === key;
}
export const isFunction = (value) => {
  return typeof value === "function";
}
//缓存函数
const cacheStringFunction = (fn) => {
  const cache = Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }
}
const camelizeRE = /-(\w)/g
export const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (c) => (c ? c.toUpperCase() : ''));
})
export const capitalize = cacheStringFunction((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
})

export const toHandlerKey = cacheStringFunction((str) => {
  return str ? `on${capitalize(str)}`:''
})

const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cacheStringFunction((str) => {
  return str.replace(hyphenateRE,"-$1").toLowerCase();//这里匹配第一个大写字母(不在开头)
})