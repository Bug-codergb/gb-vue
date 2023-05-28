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
  for (let key in user) {
    console.log(key);
  }  
});
effect(() => {
  console.log("-----"+user.name+"------");
})
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
window.stu = stu;

stu[3] = {
  name: "app",
  age:10
}