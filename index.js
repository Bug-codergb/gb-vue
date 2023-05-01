import { reactive } from "./reactivity/reactive.js";
import { computed } from "./reactivity/computed.js";
import { effect } from "./reactivity/effect.js";
import { createApp } from "./runtime-core/createApp.js";
import App from "./App.js";

//分支切换
/*effect(() => {
  let label = user.isOk ? user.name : "今天是个好日子";
  console.log("--------+" + label + "+--------");
})*/

//嵌套依赖收集与执行
/*effect(() => {
  user.gender;
  console.log("--------gender--------");

  effect(() => {
    user.age;
    console.log("------------age-----------");
  })
})*/
//自增
/*effect(() => {
  user.age++;
  console.log("----------age1-----------")
})*/

//调度执行，将effecFn的执行时机暴露给用户
/*effect(() => {
  user.age;
  console.log("------------ag1-----------");
}, {
  scheduler(fn) {
    console.log(fn);
  }
})
effect(() => {
  user.age;
  console.log("----------age2------------");
}, {
  scheduler(fn) {
    console.log(fn);
    fn();
  }
})*/



// const res = computed(() => {
//   return user.age+1;
// })

// effect(() => {
//   console.log(res.value);
// }, {})

// user.age++;
window.flag = true;
const app = createApp(App).mount(document.getElementById("app"));