import { NO, isFunction } from "../../shared/src/general.js";
import { isObject } from "../../shared/src/index.js";
import { createVNode } from "./vnode.js";

export function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = Object.assign({},rootComponent);
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    let isMounted = false;

    const app = {
      use() {
        
      },
      component() {
        
      },
      directive() {
        
      },
      mount(rootContainer) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps);
          
          render(vnode, rootContainer);
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          app._instance = rootComponent;
        }
      },
      unmount() {
        
      },
      provide() {
        
      }
    }
    return app;
  }
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
      complierOptions:{}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache:new WeakMap
  }
}