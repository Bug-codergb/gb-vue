import { isArray, isString, hyphenate } from './general.js';
import isObject from './isObject.js';

/*
  {
    "fontSize": "12px",
    "border": "1px solid #ec4141",
    "backgroundColor": "pink",
    "color": "#bfa"
}
*/
export function normalizeStyle(
  value,
) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString(item)
        ? parseStringStyle(item)
        : (normalizeStyle(item));
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } if (isString(value)) {
    return value;
  } if (isObject(value)) {
    return value;
  }
}

const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:([^]+)/;
const styleCommentRE = /\/\*[^]*?\*\//g; // 替换样式中的注释

export function parseStringStyle(cssText) {
  const ret = {};
  cssText
    .replace(styleCommentRE, '')
    .split(listDelimiterRE)
    .forEach((item) => {
      if (item) {
        const tmp = item.split(propertyDelimiterRE);
        tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
      }
    });
  return ret;
}

export function stringifyStyle(
  styles,
) {
  let ret = '';
  if (!styles || isString(styles)) {
    return ret;
  }
  for (const key in styles) {
    const value = styles[key];
    const normalizedKey = key.startsWith('--') ? key : hyphenate(key);
    if (isString(value) || typeof value === 'number') {
      // only render valid values
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
/*
  1. 传入为字符串时 直接return 如class=“app”
  2. 传入为字符串数组时 ， 直接拼接 class=['container','inner]
  3. 传入为对象时，判断对象的键对应的值是否为true ， 为true1时则加入class 如 class={active:true}
  4. 传入为对象数组时，则遍历每一个item，判断item类型（字符串｜数组｜对象）
  5. 最终拼接为一个空格隔开的字符串
*/
export function normalizeClass(value) {
  let res = '';
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += `${normalized} `;
      }
    }
  } else if (isObject(value)) { // 当为对象是，对象的value为true时才会加入class
    for (const name in value) {
      if (value[name]) {
        res += `${name} `;
      }
    }
  }
  return res.trim();
}

export function normalizeProps(props) {
  if (!props) return null;
  const { class: klass, style } = props;
  if (klass && !isString(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
