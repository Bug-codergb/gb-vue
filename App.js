import { reactive } from "./reactivity/reactive.js";
import { h } from "./runtime-core/h.js";
export default {
  render(context) {
    return h("ul", {}, [
      h("li", {
        onClick: () => {
          alert("床前明月光")
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
      age:12
    })
    window.user = user;
    return {
      user
    }
  }
}