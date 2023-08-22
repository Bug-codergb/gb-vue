import {
  EMPTY_OBJ, camelize, def, hasOwn, hyphenate, isArray, isFunction, isReservedProps, isString,
} from '../../shared/src/general.js';
import {
  isObject,
} from '../../shared/src/index.js';
import { InternalObjectKey } from './vnode.js';
import { toRaw } from '../../reactivity/src/index.js';
import { setCurrentInstance } from './component.js';
import { shallowReactive } from '../../reactivity/src/reactive.js';

const BooleanFlags = {
  shouldCast: 'shouleCast', // 应该被转换如Boolean没有传值时，默认为false
  shouldCastTrue: 'shouldCastTrue', // [Boolean,String] 传空串时，默认为true
};

function validatePropName(key) {
  if (key[0] !== '$') {
    return true;
  }
  return false;
}
function getType(ctor) {
  const match = ctor && ctor.toString().match(/^\s*(function|class) (\w+)/);
  return match ? match[2] : ctor === null ? 'null' : '';
}
function isSameType(a, b) {
  return getType(a) === getType(b);
}

function getTypeIndex(type, expectedTypes) {
  if (isArray(expectedTypes)) {
    return expectedTypes.findIndex((t) => isSameType(t, type));
  } if (isFunction(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : 1;
  }
  return -1;
}

export function normalizePropsOptions(comp, appContext, asMixin = false) {
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
        /**
         * props:{
         *  app:[Boolean,String],//数组情况
         *  bar:Boolean //函数情况
         * }
         */
        const prop = (normalized[normalizeKey] = isArray(opt) || isFunction(opt) ? { type: opt } : Object.assign({}, opt));
        // console.log(prop);
        if (prop) {
          const booleanIndex = getTypeIndex(Boolean, prop.type);
          const stringIndex = getTypeIndex(String, prop.type);

          prop[BooleanFlags.shouldCast] = booleanIndex > -1;
          prop[BooleanFlags.shouldCastTrue] = stringIndex < 0 || booleanIndex < stringIndex;

          if (booleanIndex > -1 || prop.hasOwnProperty('default')) {
            needCastKeys.push(normalizeKey);
          }
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

  setFullProps(instance, rawProps, props, attrs);
  /**
   * 如果传过来的props在组件的props选项上没有定义则其值设为undefined;
   */
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = undefined;
    }
  }
  if (isStateful) {
    instance.props = shallowReactive(props);
  }
  instance.attrs = attrs;
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let rawCastValues;
  let hasAttrsChanged;
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
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else {
        if (!(key in attrs) || value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = toRaw(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(
        options,
        rawCurrentProps,
        key,
        castValues[key],
        instance,
        !hasOwn(castValues, key),
      );
    }
  }
}
function resolvePropValue(
  options,
  props,
  key,
  value,
  instance,
  isAbsent,
) {
  const opt = options[key];
  if (opt !== null) {
    const hasDefault = hasOwn(opt, 'default');
    if (hasDefault && value === undefined) {
      const defaultValue = opt.default;
      if (opt.type !== Function && isFunction(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(null, props);
        }
      } else {
        value = defaultValue;
      }
    }
    if (opt[BooleanFlags.shouldCast]) {
      if (!hasDefault) {
        value = false;
      } else if (opt[BooleanFlags.shouldCastTrue] && (value === '' || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
