import { reactive } from "./reactivity/reactive.js";
import { h } from "./runtime-core/h.js";
export default {
  render(context) {
    return h("ul", {
      class:context.user.id
    }, [
      h("li", {
        onClick: () => {
          //context.user.name = "李白";
          context.user.id = "Java";
          console.log(context.user);
        }
      },"床前明月光"),
      h("li",{},"疑似地上霜"),
      h("li",{},context.user.name),
      h("li",{},context.user.age),
    ])
  },
  setup() {
    const user = reactive({
      name: "foo",
      age: 12,
      id:"JavaScript"
    })
    window.user = user;
    return {
      user
    }
  }
}