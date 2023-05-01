import { reactive } from "./reactivity/reactive.js";
import { h } from "./runtime-core/h.js";
export default {
  render(context) {
    let oldTree = h("ul", {
    }, [
      h("li", {
        key:1,
        onClick: () => {
          context.user.age = "我是旧的年龄"
          window.flag = false;
        }
      },"床前明月光"),
      h("li", {
        key:2,
        class:context.user.id
      },"疑似地上霜"),
      h("li",{key:3},context.user.name),
      h("li",{key:4},context.user.age),
    ])
    let newTree = h("ul", {
    }, [
      h("li", {
        key:1,
        onClick: () => {
          context.user.age = "我是新的年龄"
          window.flag = true;
        }
      },"床前明月光"),
      h("li", {
        key:2,
        class:context.user.id
      },"疑似地上霜"),
      h("li", { key: 4 }, context.user.age),
      h("li",{key:3},context.user.name),
    ])
    console.log(window.flag);
    return window.flag ? oldTree : newTree;
  },
  setup() {
    const user = reactive({
      name: "foo",
      age: 12,
      id: "JavaScript",
      age:"我是年龄180"
    })
    window.user = user;
    return {
      user
    }
  }
}