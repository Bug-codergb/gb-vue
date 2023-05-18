import {
  reactive,
  ref,
  effect,
  computed
} from "./reactivity/index.js";

const user = reactive({
  name: "foo",
  age: 10,
  gender: "male",
  flag: true,
  alias:"编码者"
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
/*
effect(() => {
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

/*
计算属性
const userInfo = computed(() => {
  return `${user.name}-----${user.age}`;
})
effect(() => {
  console.log(`---${userInfo.value}---`);
})*/
//分支切换
effect(() => {
  let text = user.flag ? user.name : user.alias;
  console.log(`---------${text}---------`)
})