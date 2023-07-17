import { V_SHOW } from '../runtimeHelpers.js';

export const transformShow = (dir, node, context) => {
  const { exp, loc } = dir;
  if (!exp) {
    console.error('表达式不存在');
  }
  return {
    props: [],
    needRuntime: context.helper(V_SHOW),
  };
};
