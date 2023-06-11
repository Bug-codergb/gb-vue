import { shallowReadonly } from "../reactivity/index.js";
export function createComponentInstance(vnode, parent) {
  const instance = {
    type: vnode.type,
    vnode,
    next: null,
    parent,
    proxy:null,
    isMounted:false
  }
  return instance
}
export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    const setupContext = createSetupContext(instance);
    //返回setup的结果如果是函数则是render函数，否则就是需要代理的对象
    const setupResult = setup(shallowReadonly(instance.props), setupContext);
    setCurrentInstance(null);
    handleSetupResult(instance,setupResult);
  } else {
    finishComponentSetup(instance);
  }
}
function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose:()=>{}
  }
}
function handleSetupResult(instance,setupResult) {
  if (typeof setupResult === "function") {
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (!instance.render) {
    //模板编译
  }
}
let currentInstance = {};
export function getCurrentInstance() {
  return currentInstance;
}
export function setCurrentInstance(instance) {
  currentInstance = instance;
}