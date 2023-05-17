import {
  reactive,
  ref,
  effect
} from "./reactivity/index.js";

const user = reactive({
  name: "foo",
  age:10
})
effect(() => {
  console.log(`----${user.name}---`);
})
effect(() => {
  console.log(`----${user.age}----`);
})
window.user = user;
const counter = ref(0);
window.counter = counter;

effect(() => {
  console.log(`---counter---${counter.value}-`);
})