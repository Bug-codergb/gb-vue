import { currentInstance, getComponentName } from '../component.js';
import { camelize, capitalize } from '../../../shared/src/general.js';

const __DEV__ = true;
export const COMPONENTS = 'components';
export function resolveAsset(type, name, warnMissing = true, maybeSelfReference) {
  const instance = currentInstance;
  // console.log(instance, type);
  if (instance) {
    const Component = instance.type;

    // explicit self name has highest priority
    if (type === COMPONENTS) {
      const selfName = getComponentName(
        Component,
        false, /* do not include inferred name to avoid breaking existing code */
      );
      console.log(selfName);
      if (
        selfName
        && (selfName === name
          || selfName === camelize(name)
          || selfName === capitalize(camelize(name)))
      ) {
        return Component;
      }
    }

    const res =
      // local registration
      // check instance[type] first which is resolved for options API
      resolve(instance[type] || Component[type], name)
      // global registration
      || resolve(instance.appContext[type], name);
    if (!res && maybeSelfReference) {
      // fallback to implicit self-reference
      return Component;
    }

    if (__DEV__ && warnMissing && !res) {
      const extra = type === COMPONENTS
        ? '\nIf this is a native custom element, make sure to exclude it from '
            + 'component resolution via compilerOptions.isCustomElement.'
        : '';
      console.warn(`Failed to resolve ${type.slice(0, -1)}: ${name}${extra}`);
    }

    return res;
  } if (__DEV__) {
    console.warn(
      `resolve${capitalize(type.slice(0, -1))} `
        + 'can only be used in render() or setup().',
    );
  }
}
function resolve(registry, name) {
  return (
    registry
    && (registry[name]
      || registry[camelize(name)]
      || registry[capitalize(camelize(name))])
  );
}
export function resolveComponent(
  name,
  maybeSelfReference,
) {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
