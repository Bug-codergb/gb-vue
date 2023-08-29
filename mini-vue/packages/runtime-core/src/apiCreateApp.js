import { NO, isFunction } from '../../shared/src/general.js';
import { isObject } from '../../shared/src/index.js';
import { createVNode } from './vnode.js';
// vue初始化流程 首先调用createApp
export function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = { ...rootComponent };
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    let isMounted = false;

    const installedPlugin = new Set();
    // app实例
    const app = {
      use(plugin, ...options) {
        if (installedPlugin.has(plugin)) {

        } else if (plugin && isFunction(plugin.install)) {
          installedPlugin.add(plugin);
          plugin.install(app, ...options);// 执行用户传入的install方法
        }
      },
      component() {

      },
      directive() {

      },
      mount(rootContainer) {
        if (!isMounted) {
          // 创建vnode，由于rootComponent为组件，所以createVNode的type为object,
          const vnode = createVNode(rootComponent, rootProps);

          render(vnode, rootContainer);// 调用渲染器的render方法；
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          app._instance = rootComponent;
        }
      },
      unmount() {

      },
      provide() {

      },
    };
    return app;
  };
}
export function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performace: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: undefined,
      warnHandler: undefined,
      complierOptions: {},
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap(),
  };
}
