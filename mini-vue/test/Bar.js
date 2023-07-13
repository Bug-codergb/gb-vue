import { reactive, ref } from '../packages/vue/index.js';

const temp = `
  <div class="bar">
   <ul>
     <li>lina详细信息表</li>
     <li>姓名: {{user.name}}</li>
     <li>性别: {{user.gender}}</li>
     <li>地址: {{user.address.name}}</li>
   </ul>
   <button @click="changeUserMsg">修改ta的信息</button>
   <button @click="handler">发个消息吧</button>
  </div>
`;

export default {
  name: 'Bar',
  props: {
    name: {
      type: Object,
      default() {
        return {};
      },
    },
    flag: Boolean,
    age: {
      type: Number,
      default: 18,
    },
    info: [Boolean, String],
  },

  setup(props, { emit, attrs, slot }) {
    const user = reactive({
      id: 1001,
      alias: 'lina',
      gender: 'female',
      address: {
        name: 'jining',
        detail: 'jude',
        x: 12,
        y: 15,
      },
    });
    const handler = () => {
      console.log(user.alias, user.address);
      console.log('-----props-----', props);
    };
    const changeUserMsg = () => {
      user.gender = user.gender === 'male' ? 'female' : 'male';
      user.address.name = user.address.name === 'xinqu' ? 'jude' : 'xinqu';
    };
    return {
      user,
      handler,
      changeUserMsg,
    };
  },
};
