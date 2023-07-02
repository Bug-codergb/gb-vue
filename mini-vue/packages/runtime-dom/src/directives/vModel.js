export const vModelText = {
  created(el, { modifiers }, vnode) {

  },
  mounted(el, { value }) {
    el.value = value == null ? '' : value;
  },
};
