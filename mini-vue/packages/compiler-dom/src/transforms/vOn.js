import { transformOn as baseTransform } from '../../../compiler-core/src/transforms/vOn.js';

export const transformOn = (dir, node, context) => baseTransform(dir, node, context, (baseResult) => {
  const { modifiers } = dir;
  if (!modifiers.length) {
    return baseResult;
  }
});
