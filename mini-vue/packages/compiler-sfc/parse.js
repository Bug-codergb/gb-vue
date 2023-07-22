import * as CompilerDOM from '../compiler-dom/src/index.js';

export const DEFAULT_FILENAME = 'anonymous.vue';

export function parse(
  source,
  {
    sourceMap = true,
    filename = DEFAULT_FILENAME,
    sourceRoot = '',
    pad = false,
    ignoreEmpty = true,
    compiler = CompilerDOM,
  },
) {
  const sourceKey = source + sourceMap + filename + sourceRoot + pad + compiler.parse;
}
