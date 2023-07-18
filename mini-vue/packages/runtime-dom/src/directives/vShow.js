export const vShow = {
  beforeMount(el, { value }, { transition }) {
    el._vod = el.style.display === 'none' ? '' : el.style.display;
    setDisplay(el, value);
  },
  mounted(el, { value }, { transition }) {

  },
  update(el, { value, oldValue }, { trnasition }) {
    if (!value === !oldValue) return;
    setDisplay(el, value);
  },
  beforeUnmount(el, { value }) {

  },
};
function setDisplay(el, value) {
  el.style.display = value ? el._vod : 'none';
}
