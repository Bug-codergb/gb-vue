import { reactive } from "./reactivity/reactive.js";
import { effect } from "./reactivity/effect.js";
const user = reactive({
  name: "bug",
  age: 10,
  isOk:true
})
effect(() => {
  let label = user.isOk ? user.name : "今天是个好日子";
  console.log("--------+"+label+"+--------");
})
user.name = "12"
user.isOk = false;

user.name = "app";
user.name = "fffff";