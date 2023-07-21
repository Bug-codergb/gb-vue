import { reactive, ref, watch } from '../packages/vue/src/index.js';
// import Bar from './Bar.js';

const temp = `
   <span>
    <div v-show="app">测试vShow</div>
    <input v-model="foo"/>
    <button @click="handlers">修改</button>
   </span>
`;
const App = {
  template: temp,
  props: {
    app: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const user = reactive({
      name: 'app',
      age: 18,
    });

    const app = ref(true);
    const foo = 'lina';
    const bar = false;
    const handler = () => {
      console.log('jintianshigehaoriz1');
    };
    const appProp = 'linalina';
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
    const bgc = 'pink';

    watch(user, (newVal, oldVal) => {
      console.log(newVal, oldVal);
    });
    watch(() => user.age, (newValue, oldValue) => {
      console.log(newValue, oldValue);
    });
    const handlers = () => {
      user.name = user.name === 'app' ? 'web' : 'app';
      user.age++;
    };
    return {
      handlers,
      user,
      app,
      foo,
      handler,
      bar,
      appProp,
      flag,
      classProp1,
      classProp2,
      bgc,
    };
  },
};
export default App;
