import { EMPTY_OBJ, isFunction } from '../../shared/src/general.js';

export function withDirectives(vnode, directives) {
  console.log(directives);
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction(dir)) {
        dir = {
          mounted: dir,
          updated: dir,
        };
      }
      if (dir.deep) {
        traverse(value);
      }
      bindings.push({
        dir,
        instance: {},
        value,
        oldValue: void 0,
        arg,
        modifiers,
      });
    }
  }
  return vnode;
}

export function invokeDirectiveHook(
  vnode,
  prevNode,
  instance,
  name,
) {
  const bindings = vnode.dirs;
  const oldBindings = prevNode && prevNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    const hook = binding.dir[name];

    if (hook) {
      hook(vnode.el, binding, vnode, prevNode);
    }
  }
}
