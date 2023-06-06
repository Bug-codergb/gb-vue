import { isFunction } from "../shared/src/general.js";
import { isObject } from "../shared/src/index.js";
import { createVode } from "./vnode.js";

export function createAppAPI(render, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (!isFunction(rootComponent)) {
      rootComponent = Object.assign({},rootComponent);
    }
    if (rootProps != null && !isObject(rootProps)) {
      rootProps = null;
    }
    let isMounted = false;
    console.log(rootComponent)
    const app = {
      use() {
        
      },
      component() {
        
      },
      directive() {
        
      },
      mount(rootContainer) {
        if (!isMounted) {
          const vnode = createVode(rootComponent, rootProps);
          console.log(vnode);
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