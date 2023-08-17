import {
  reactive, ref, watch, onBeforeMount, onMounted,
  parseSfc,
} from '../packages/vue/src/index.js';

// import Bar from './Bar.js';

const temp = `
   <div class="container" key="90">
     <template v-if="app">
       <div key="1001">锄禾日当午</div>
       <div key="1002">汗滴禾下土</div>
       <span key="1003">{{ appProp }}</span>
       <div key="1004">谁知盘中餐</div>
       <p key="1005">{{ foo }}</p>
       <div key="1006">粒粒皆辛苦</div>
     </template>
     <template v-else>
       <p key="1005">{{ foo }}</p>
       <div key="1006">粒粒皆辛苦</div>
       <span key="1003">{{ appProp }}</span>
       <div key="1004">谁知盘中餐</div>
       <div key="1001">锄禾日当午</div>
       <div key="1002">汗滴禾下土</div>
     </template>
     <button key="1007" @click="handlers">点击切换</button>
   </div>
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
    const foo = ref('lina');
    const bar = false;
    const handler = () => {
      console.log('jintianshigehaoriz1');
    };
    const appProp = ref('gblina');
    const flag = true;

    const classProp1 = 'active';
    const classProp2 = 'bar';
    const bgc = 'pink';

    const handlers = () => {
      foo.value = foo.value === 'lina' ? '李娜' : 'lina';
      appProp.value = appProp.value === 'gblina' ? '郭斌李娜' : 'gblina';
      app.value = !app.value;
    };
    const list = [
      {
        id: 1001,
        name: 'web',
      },
      {
        id: 1002,
        name: 'app',
      },
      {
        id: 1003,
        name: 'tomcat',
      },
      {
        id: 1004,
        name: 'vite',
      },
    ];

    const obj = {
      name: '我在查找',
    };
    const proxy = reactive([
      obj,
    ]);

    return {
      list,
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
      proxy,
    };
  },
};

const sfc = `
  <template>
    <div class="container">
      <div v-show="app">{{ app }}</div>
    </div>
  </template>
  <script setup>
    import { ref,reactive } from "vue";
    const app = ref(true);
    const user = reactive({
      name:"web",
      age:18
    })
  </script>
  <style scoped>
    .container{
      color:pink
    }
  </style>
`;
parseSfc(sfc, {});
export default App;
