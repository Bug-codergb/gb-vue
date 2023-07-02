import { EMPTY_OBJ,hasOwn } from "../../shared/src/general.js";

const publicPropertiesMap = {
  // 当用户调用 instance.proxy.$emit 时就会触发这个函数
  // i 就是 instance 的缩写 也就是组件实例对象
  $el: (i) => i.vnode.el,
  $data:i=>i.data,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
  $emit: i => i.emit,
  $nextTick:i=>i.n
};

const hasSetupBinding = (state,key) => {
  state !== EMPTY_OBJ && hasOwn(state,key);
}
const AccessTypes = {
  OTHER: 1,
  SETUP: 2,
  DATA: 3,
  PROPS: 4,
  CONTEXT:5
}
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { ctx,setupState,data,type, props,appContext,accessCache } = instance;

    let normalizedProps

    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== undefined) {
        
      } else if (hasSetupBinding(setupState,key)) {
        accessCache[key] = AccessTypes.SETUP;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = AccessTypes.DATA;
        return data[key];
      } else if (normalizedProps = instance.propsOptions[0] && hasOwn(normalizedProps, key)) {
        accessCache[key] = AccessTypes.PROPS;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = AccessTypes.CONTEXT;
        return ctx[key];
      } else {
        accessCache[key] = AccessTypes.OTHER;
      }


      if (hasOwn(setupState, key)) {
        return setupState[key];
      } else if (hasOwn(props, key)) {
        // 看看 key 是不是在 props 中
        // 代理是可以访问到 props 中的 key 的
        return props[key];
      }
    }

    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  },

  set({ _: instance }, key, value) {
    const { setupState,data,ctx } = instance;

    if (hasOwn(setupState, key)) {
      // 有的话 那么就直接赋值
      setupState[key] = value;
    }

    return true
  },
};
