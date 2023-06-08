const createDep = (effectFn) => {
  let dep = new Set();
  if (effectFn) {
    dep.add(effectFn);
  }
  return dep;
}
export {
  createDep
}