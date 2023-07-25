import { shallowReadonly, proxyRefs } from '../../reactivity/src/index.js';
import { PublicInstanceProxyHandlers, createDevRenderContext } from './componentPublicInstance.js';
import { createAppContext } from './apiCreateApp.js';
import { EMPTY_OBJ, isFunction } from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import ShapeFlags from '../../shared/src/shapeFlags.js';
import { markRaw } from '../../reactivity/src/reactive.js';
import { initProps, normalizePropsOptions } from './componentProps.js';

let compile = void 0;

let uid = 0;
const emptyAppContext = createAppContext();

export function createComponentInstance(vnode, parent, suspense) {
  const { type } = vnode;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++,
    type,
    vnode,
    parent,
    root: null,
    next: null,
    subTree: null,
    effect: null,
    update: null,
    scope: {},
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    components: null,
    directives: null,

    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: {},

    accessCache: null,
    renderCache: [],

    emit: null,
    emitted: null,

    isMounted: false,
    isUnmounted: false,
    ctx: {},
    props: {},
    attrs: {},

    setupState: EMPTY_OBJ,
    setupContext: EMPTY_OBJ,

    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
  };

  instance.ctx = createDevRenderContext(instance);
  instance.root = parent ? parent.root : instance;
  instance.emit = null;
  return instance;
}

export function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);

  initProps(instance, props, isStateful, false);

  const setupResult = isStateful
    ? setupStatefulComponent(instance) : undefined;
  return setupResult;
}
function setupStatefulComponent(instance) {
  const Component = instance.type;// type 为选项

  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));

  const { setup } = Component;
  if (setup) {
    const setupContext = (instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null);
    setCurrentInstance(instance);

    // 返回setup的结果如果是函数则是render函数，否则就是需要代理的对象
    const setupResult = setup(shallowReadonly(instance.props), setupContext);

    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}
function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {},
  };
}
function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (!instance.render) {
    // 模板编译
    if (compile && !Component.render) {
      if (Component.template) {
        Component.render = compile(Component.template);
      }
    }
    instance.render = Component.render;
  }
}
export let currentInstance = {};
export function getCurrentInstance() {
  return currentInstance;
}
export function setCurrentInstance(instance) {
  currentInstance = instance;
}
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}
