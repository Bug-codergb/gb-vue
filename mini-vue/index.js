import {
  reactive,
  ref,
  effect,
  computed
} from "./reactivity/index.js";

/*const user = reactive({
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

const stu = reactive([
  {
    name: "foo",
    age:10
  },
  {
    name: "bar",
    age:14
  },
  {
    name: "coder",
    age:80
  }
])
window.stu = stu;*/

/*let obj = { name: "123" };
let list = reactive([1,2,3,4,obj,6]);
effect(() => {
  console.log(list.includes(obj));
})
window.obj = obj;
window.list = list;*/
const arr = reactive([10, 11, 12, 13, 14, 15]);
/*effect(() => {
  for (let key in arr) {
    console.log(key);//触发ownKeys
  }
})*/
effect(() => {
  for (let item of arr) {
    console.log(item);
  }
})
window.arr = arr;