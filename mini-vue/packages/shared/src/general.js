export const NOOP = () => {};
export const NO = () => false;
export const EMPTY_OBJ = Object.freeze({});
export const EMPTY_ARRAY = Object.freeze([]);

const onRE = /^on[^a-z]/;
export const isOn = (key) => onRE.test(key);

export const objectToString = Object.prototype.toString;
export const toTypeString = (value) => objectToString.call(value);

export const isReservedProps = (key) => {
  const map = new Map([
    ['key', true],
    ['ref', true],
  ]);
  return !!map.get(key);
};
export const hasChanged = (newValue, oldValue) => !Object.is(newValue, oldValue);
export const isString = (value) => typeof value === 'string';
export const isSymbol = (value) => typeof value === 'symbol';
export const isArray = (value) => Array.isArray(value);

export const isMap = (val) => toTypeString(val) === '[object Map]';
export const isSet = (val) => toTypeString(val) === '[object Set]';
export const isPlainObject = (val) => toTypeString(val) === '[object Object]';

export const isIntegerKey = (key) => isString(key) && key !== NaN && `${parseInt(key, 10)}` === key;
export const isFunction = (value) => typeof value === 'function';
// 缓存函数
const cacheStringFunction = (fn) => {
  const cache = Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
export const camelize = cacheStringFunction((str) => str.replace(camelizeRE, (c) => (c ? c.toUpperCase() : '')));
export const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));

export const toHandlerKey = cacheStringFunction((str) => (str ? `on${capitalize(str)}` : ''));

const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase()); // 这里匹配第一个大写字母(不在开头)

export const def = (obj, key, value) => {
  Object.defineProperty(obj, key, { // 不可以枚举
    configurable: true,
    enumerable: false,
    value,
  });
};

const { hasOwnProperty } = Object.prototype;
export const hasOwn = (val, key) => hasOwnProperty.call(val, key);

export const invokArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
export const looseToNumber = (val) => {
  const n = parseFloat(val);
  return Number.isNaN(n) ? val : n;
};
