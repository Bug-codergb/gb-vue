import {
  isString,
} from '../../shared/src/general.js';
import { complie } from '../../complier-dom/src/index.js';
import { registerRuntimeCompiler } from '../../runtime-dom/src/index.js';
import * as runtimDom from '../../runtime-dom/src/index.js';

const complieCache = Object.create(null);
export function complieToFunction(template, options) {
  if (!isString(template)) {

  }
  const key = template;
  const cached = complieCache[key];
  if (cached) {
    return cached;
  }
  const opts = {
    hoistStatic: true,
    ...options,
  };
  const { code } = complie(template, opts);
  const render = new Function('Vue', code)(runtimDom);
  return complieCache[key] = render;
}
registerRuntimeCompiler(complieToFunction);
export * from '../../runtime-dom/src/index.js';
