import {
  EMPTY_OBJ, camelize, def, hasOwn, isArray, isFunction, isReservedProps, isString,
} from '../../shared/src/general.js';
import {
  isObject,
} from '../../shared/src/index.js';
import { InternalObjectKey } from './vnode.js';

function validatePropName(key) {
  if (key[0] !== '$') {
    return true;
  }
  return false;
}

export function normalizePropsOptions(comp, appContext, asMixin) {
  const cache = appContext.propsCache;
  const cached = cache.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];

  const hasExtends = false;

  if (!raw && !hasExtends) {
    if (isObject(comp)) {
      cache.set(comp, EMPTY_OBJ);
    }
    return EMPTY_OBJ;
  }
  if (isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      if (!isString(raw[i])) {
        console.log('props must be strings when useing array');
      }
      const normalizeKey = camelize(raw[i]);// 将props的key转换为驼峰
      if (validatePropName(normalizeKey)) {
        /**
         * 当props为数组时，它的元素只能为string //如 props:['foo','bar];
         */
        normalized[normalizeKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    if (!isObject(raw)) {
      console.warn('invalid props options');
      return null;
    }
    for (const key in raw) {
      const normalizeKey = camelize(key);
      if (validatePropName(normalizeKey)) {
        const opt = raw[key];
        const prop = (normalized[normalizeKey] = isArray(opt) || isFunction(opt) ? { type: opt } : Object.assign({}, opt));
        console.log(prop);
        if (prop) {

        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  if (isObject(comp)) {
    cache.set(comp, res);
  }
  return res;
}
export function initProps(instance, rawProps, isStateful, isSSR) {
  const props = {};
  const attrs = {};
  def(attrs, InternalObjectKey, 1);
  instance.propsDefaults = Object.call(null);
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let rawCastValues;
  if (rawProps) {
    for (const key in rawProps) {
      if (isReservedProps(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, (camelKey = camelize(key)))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {

        }
      }
    }
  }
}
