import { reactive, ref } from '../packages/vue/src/index.js';
// import Bar from './Bar.js';

const temp = `
   <span>
    <div v-show="app">测试vShow</div> 
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
    return {
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
