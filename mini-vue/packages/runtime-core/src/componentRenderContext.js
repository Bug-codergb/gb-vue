export let currentRenderingInstance = null;
// render函数执行之前设置
export function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  return prev;
}
export function withCtx(fn, ctx, isNonScopedSlot = currentRenderingInstance) {
  if (!ctx) return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    const prevInstance = setCurrentRenderingInstance(ctx);
    
    let res;
    try {
      res = fn(...args);
    } finally {
      setCurrentRenderingInstance(prevInstance);
    }

    return res;
  };
  renderFnWithContext._n = true;
  // mark this as compiled by default
  // this is used in vnode.ts -> normalizeChildren() to set the slot
  // rendering flag.
  renderFnWithContext._c = true;
  // disable block tracking by default
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
