import { reactive } from "./reactivity/reactive.js";
import { h } from "./runtime-core/h.js";
export default {
  render(context) {
    let oldTree = h("ul", {
    }, [
      h("li", {
        key:1,
        onClick: () => {
          context.user.flag = false;
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
      h("li",{key:5},"低头思故乡"),
      h("li", {
        key:2,
        class:context.user.id
      }, "疑似地上霜"),
      h("li", {
        key:1,
        onClick: () => {
          
        }
      },"床前明月光"),
      h("li", { key: 4 }, context.user.age),
      h("li",{key:3},context.user.name),
      
    ])
   
    return context.user.flag ? oldTree : newTree;
  },
  setup() {
    const user = reactive({
      name: "foo",
      age: 12,
      id: "JavaScript",
      age: "我是旧年龄",
      flag: true,
    })
    return {
      user
    }
  }
}