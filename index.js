import { reactive } from "./reactivity/reactive.js";
import { effect } from "./reactivity/effect.js";
const user = reactive({
  name: "bug",
  age:10,
})

effect(() => {
  console.log(user.age);
})
effect(() => {
  console.log(user.name);
})
user.name = "coder";
user.name = "gb";
user.age = 23
