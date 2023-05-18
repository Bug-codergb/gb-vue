import {
  reactive,
  ref,
  effect,
  computed
} from "./reactivity/index.js";

const user = reactive({
  name: "foo",
  age: 10,
  gender:"male"
})
/*effect(() => {
  console.log(`----${user.name}---`);
})
effect(() => {
  console.log(`----${user.age}----`);
})*/
window.user = user;
const counter = ref(0);
window.counter = counter;
/*effect(() => {
  effect(() => {
    effect(() => {
      console.log(`----${user.gender}----`);
    })
    console.log(`------${user.age}------`);
  });
  console.log(`----${user.name}----`);
})*/
/*effect(() => {
  console.log(`---counter---${counter.value}-`);
})*/

const userInfo = computed(() => {
  return `${user.name}-----${user.age}`;
})

effect(() => {
  console.log(`---${userInfo.value}---`);
})