import { shallowReadonly, proxyRefs } from '../../reactivity/src/index.js';
import { PublicInstanceProxyHandlers, createDevRenderContext } from './componentPublicInstance.js';
import { createAppContext } from './apiCreateApp.js';
import { EMPTY_OBJ, isFunction } from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import ShapeFlags from '../../shared/src/shapeFlags.js';
import { markRaw } from '../../reactivity/src/reactive.js';
import { initProps, normalizePropsOptions } from './componentProps.js';
import { initSlots } from './componentSlots.js';
import { applyOptions } from './componentOptions.js';

import { emit } from './componentEmits.js';

let compile = void 0;

let uid = 0;
const emptyAppContext = createAppContext();

export function createComponentInstance(vnode, parent, suspense) {
  const { type } = vnode;
  const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid++, // 每一个组件，
    type,
    vnode,
    parent,
    root: null,
    next: null,
    subTree: null, // render函数执行结果
    effect: null,
    update: null,
    scope: {},
    render: null,
    proxy: null, // 这里vue会将setup返回值，data,props的数据全部代理到proxy上面，用户直接通过this访问
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent ? parent.provides : Object.create(appContext.provides),
    components: null,
    directives: null,

    propsOptions: normalizePropsOptions(type, appContext), // 提前将props做处理，比如类型的默认设置
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

    setupState: EMPTY_OBJ, // setup返回值代理
    setupContext: EMPTY_OBJ,
    data: EMPTY_OBJ,

    bc: null, // 生命周期
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
  };

  instance.ctx = createDevRenderContext(instance);
  // 创建一个组件的context,之后会对该ctx做一个代理，用户访问setup，props，data,等属性时直接通过instance.proxy访问
  instance.root = parent ? parent.root : instance;
  instance.emit = emit.bind(null, instance);
  // 组件内部时间处理，原理和react子组件通信一致，就是将一个函数传给子组件，子组件调用这个函数，在父组件里面的函数声明里面响应
  /**
   * 父组件 const foo=()=>{ 这里获取调用  }
   *
   * 子组件调用foo(...arg)
   */
  return instance;
}

export function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  // console.log(instance, props);
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, false);// 将props和attrs分别设置到对应obj上面

  /**
   * 设置插槽相关，<slot name="foo"></slot> 在编译阶段会编译成renderSlot(ctx.$slot,"foo",()=>vnode);
   * renderSlot调用renderslot后，会生成vnode( Fragment, {key:_name}, fallback() )
   *
   */
  initSlots(instance, children);
  const setupResult = isStateful
    ? setupStatefulComponent(instance) : undefined;
  return setupResult;
}
function setupStatefulComponent(instance) {
  const Component = instance.type;// type 为选项

  instance.accessCache = Object.create(null);
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));// render函数传参

  const { setup } = Component;
  if (setup) {
    const setupContext = (instance.setupContext = setup.length > 1 ? createSetupContext(instance) : null);
    setCurrentInstance(instance);

    // 返回setup的结果如果是函数则是render函数，否则就是需要代理的对象
    const setupResult = setup(shallowReadonly(instance.props), setupContext);

    // setCurrentInstance(null);
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
    instance.setupState = proxyRefs(setupResult);// 对setup的返回值做一个代理，在视图中使用的时候ref解包
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (!instance.render) {
    // 模板编译
    if (compile && !Component.render) {
      if (Component.template) {
        Component.render = compile(Component.template);// 用户没有书写render函数则进行模板编译
      }
    }
    instance.render = Component.render;
  }

  applyOptions(instance);
  // console.log(instance);
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
export function getComponentName(
  Component,
  includeInferred = true,
) {
  return isFunction(Component)
    ? Component.displayName || Component.name
    : Component.name || (includeInferred && Component.__name);
}
