const createDep = (effects) => {
  let set = new Set(effects);
  set.w = 0;
  set.n = 0;
  return set;
}
const wasTracked = (dep) => {
  
}
const newTracked = (dep) => {
  
}
const initDepMakers = (reactiveEffect) => {
  const { deps } = reactiveEffect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++){
      
    }
  }
}
export {
  createDep,
  initDepMakers
}