import { ReactiveEffect } from '../../reactivity/src/effect.js';
import { isReactive } from '../../reactivity/src/reactive.js';
import { isRef } from '../../reactivity/src/ref.js';
import {
  EMPTY_OBJ, isFunction, isArray, isSet, isMap, isPlainObject, hasChanged,
} from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import { currentInstance } from './component.js';
import { queueJob } from './scheduler.js';

const INITIAL_WATCHER_VALUE = {};

export function watch(source, cb, options) {
  if (!isFunction(cb)) {
    console.error('source must be a fn');
  }
  return doWatch(source, cb, options);
}
function doWatch(source, cb, {
  immediate,
  deep,
  flush,
  onTrach,
  onTrigger,
} = EMPTY_OBJ) {
  const instance = currentInstance;
  const isMultiSource = false;
  let getter = () => { };
  if (isRef(source)) {
    getter = () => source.value;
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isArray(source)) {

  } else if (isFunction(source)) {
    if (cb) {
      getter = () => source();
    } else {
      getter = () => {

      };
    }
  }
  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup;
  const onCleanup = (fn) => {
    cleanup = effect.onStop = () => {
      fn();
    };
  };

  let oldValue = isMultiSource ? new Array(source.length).fill(INITIAL_WATCHER_VALUE) : INITIAL_WATCHER_VALUE;

  const job = () => {
    if (!effect.active) {
      return;
    }
    if (cb) {
      const newValue = effect.run();
      if (deep || hasChanged(newValue, oldValue)) {
        if (cleanup) {
          cleanup();
        }
        cb(newValue, oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue);
        oldValue = newValue;
      }
    }
  };

  let scheduler;
  if (flush === 'sync') {
    scheduler = job;
  }
  scheduler = () => queueJob(job);

  const effect = new ReactiveEffect(getter, scheduler);

  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run();
  }
}
export function traverse(value, seen) {
  if (!isObject(value)) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }

  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key], seen);
    }
  }
  return value;
}
