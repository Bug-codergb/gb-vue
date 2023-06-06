import { reactive } from "../packages/reactivity/index.js";
const App = {
  setup() {
    const user = reactive({
      name: "app",
      age:18,
    })
    return {
      user
    }
  }
}
export default App;