import {
  isFunction,
} from '../../shared/src/general.js';

export function defineComponent(options, extraOptions) {
  return isFunction(options)
    ? (() => Object.assign({ name: options.name }, extraOptions, { setup: options }))() : options;
}
