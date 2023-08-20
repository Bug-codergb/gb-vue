export function applyOptions(instance) {
  const options = resolveMergedOptions(instance);
  const { components } = options;
  if (components) {
    instance.components = components;
  }
}
export function resolveMergedOptions(instance) {
  const base = instance.type;
  let resolved;
  resolved = Object.assign({}, base);
  return resolved;
}
