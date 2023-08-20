import { createVNode } from '../vnode.js';

export function renderSlot(slots, name, props, fallback, noSlotted) {
  if (name !== 'default') {
    props.name = name;
  }
  return createVNode('slot', props, fallback && fallback());
}
