import { reactive, ref, complieToFunction } from '../packages/vue/src/index.js';

const temp = `
   <div @click="handler">
     <p>{{foo}}</p>
     <ul>
       <li :class="{classProp1:app}">{{ appProp }}</li>
     </ul>
   </div>
`;
const App = {
  template: temp,
  setup() {
    const user = reactive({
      name: 'app',
      age: 18,
    });

    const app = true;
    const foo = 'lina';
    const bar = false;
    const handler = () => {
      console.log('jintianshigehaoriz1');
    };
    const appProp = 'linalina';
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
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
    };
  },
};
export default App;
