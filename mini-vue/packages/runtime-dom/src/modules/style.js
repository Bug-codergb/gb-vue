import { camelize, capitalize, hyphenate, isString } from "../../../shared/src/general.js";

const importantRE = /\s*!important$/
export function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString(next);//暂时先不判断，后续实现
  for (const key in prev) {
    if (next[key] == null) {
      setStyle(style,key,"");
    }
  }
  for (const key in next) {
    setStyle(style,key,next[key]);
  }
}
function setStyle(style,name,val) {
  if (Array.isArray(val)) {
    val.forEach(v => setStyle(style, name, v));
  } else {
    if (val == null) val = "";
    else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {//是否带!important
        style.setProperty(
          hyphenate(prefixed), //设置 - 连接的属性名，不可以设置驼峰命名的属性
          val.replace(importantRE, ""),
          'important'
        );
      }
      style[prefixed] = val;
    }
  }
}
const prefixes = ['Webkit','Moz','ms'];
const prefixCache = {};
function autoPrefix(style,rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== 'filter' && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);//首字母大写
  for (let i = 0; i < prefixes.length; i++){
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = name;
    }
  }
  return rawName;
}