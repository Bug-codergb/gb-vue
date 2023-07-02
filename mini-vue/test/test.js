const effect = (fn) => {
  console.log(fn);
};
const user = {
  name: 'app',
  age: 180,
};
/*
 trackOpBit = 1 // 0000 0001
 effectTrackDepth = 0;
*/
// 初始化执行的时候 每嵌套一层effect时会重新 new ReactiveEffect() dep对应的 w 和 n都是 0
effect(() => {
  // 左移一位 trackOpBit = 2 // 0000 0010
  console.log(`--------${user.name}-------`); // name-> w:0000 0000 , n : 0000 0010
  console.log(`--------${user.age}--------`); // age->  w:0000 0000 , n : 0000 0010
  effect(() => {
    // 再次左移一位 trackOpBit = 4 // 0000 0100
    console.log(`---------${user.name}--------`); // name-> w:0000 0000, n : 0000 0100
    console.log(`---------${user.age}--------`); // age->   w:0000 0000, n : 0000 0100
    effect(() => {
      // 再次左移一位 trackOpBit = 8 // 0000 1000
      console.log(`--------${user.age}--------`); // age-> w:0000 0000, n : 0000 1000
    });
  });
}); // 初始化完毕之后 所有dep对应的w和n都会被置为 0 (调用源码的finalizeDepMakers方法) 恢复到初始状态 dep.n = 0 , dep.w=0

// 响应式数据更新的时候
effect(() => {
  // 左移一位 trackOpBit = 2 // 0000 0010
  /*
    在用户传入的fn执行之前 会初始化depMakers 调用源码中的initDepMakers方法 ，之前收集的dep的w将被标记如下
  */
  console.log(`--------${user.name}-------`); // name-> w:0000 0010 , n : 0000 0010
  console.log(`--------${user.age}--------`); // age->  w:0000 0010 , n : 0000 0010
  effect(() => {
    // 再次左移一位 trackOpBit = 4 // 0000 0100
    console.log(`---------${user.name}--------`); // name-> w:0000 0100, n : 0000 0100
    console.log(`---------${user.age}--------`); // age->   w:0000 0100, n : 0000 0100
    effect(() => {
      // 再次左移一位 trackOpBit = 8 // 0000 1000
      console.log(`--------${user.age}--------`); // age-> w:0000 1000, n : 0000 1000
    });
  });
}); // 更新流程执行完毕之后 所有dep的w和n都会被置为0 (调用源码的finalizeDepMakers方法) 恢复到初始状态 dep.n=0, dep.w=0
