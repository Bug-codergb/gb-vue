import { EMPTY_OBJ, isFunction } from "../../shared/src/general.js";

export function withDirectives(vnode, directives) {
  //console.log(directives)
  const bindings = vnode.dirs || (vnode.dirs=[]);
  for (let i = 0; i < directives.length; i++){
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (dir) {
      if (isFunction(dir)) {
        dir = {
          mounted: dir,
          updated:dir
        }
      }
      if (dir.deep) {
        traverse(value);
      }
      bindings.push({
        dir,
        instance:{},
        value,
        oldValue: void 0,
        arg,
        modifiers
      })
    }
  }
  return vnode;
}