import { reactive } from "./reactivity/reactive.js";
import { effect } from "./reactivity/effect.js";
const user = reactive({
  name: "bug",
  age: 10,
  isOk: true,
  gender:'male'
})
/*effect(() => {
  let label = user.isOk ? user.name : "今天是个好日子";
  console.log("--------+" + label + "+--------");
})*/

effect(() => {
  user.gender;
  console.log("--------gender--------");

  effect(() => {
    user.age;
    console.log("------------age-----------");
  })
})

user.age = 15;
user.gender = "female"