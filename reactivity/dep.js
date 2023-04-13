const createDep = (activeEffect) => {
  let dep = new Set();
  if (activeEffect) {
    dep.add(activeEffect);
  }
  return dep;
}
export {
  createDep
}