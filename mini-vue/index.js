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
  alias: "编码者",
  address: {
    name: "北京市",
    alias:"首都"
  }
})
window.user = user;
const counter = ref(0);
window.counter = counter;

effect(() => {
  console.log(`-----${user.address.alias}----`);
})
