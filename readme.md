## gb-mini-vue(记录学习vue3源码过程)

huochunyang-mini-vue对于《Vuejs设计与实现》实现思路,在mini-vue中是对于另一个库《mini-vue》+ vue3源码的实现,将vue3源码逻辑抽离出来但又保证主要实现逻辑。不同模块提取中...，直接通过mini-vue/main.html运行调试，//忽略compiler-sfc

##

- 响应式
```
响应式是vue3的核心，是学习vue3的一个重点，相比较于vue2，vue3通过proxy实现数据劫持。
```
- [x] dep
- [x] initDepMakers
- [x] fininalizeDeoMakers
- [x] ReactiveEffect
- [x] effect
- [x] computed
- [x] readonly
- [x] ref
- [x] shallowRef
- [x] unRef
- [x] isRef
- [x] customRef
- [x] reactive
- [x] shallowReactive
- [x] readonly
- [x] shallowReadonly
- [x] toRaw
- [x] toReactive

```
vue3通过位运算实现依赖的收集与清除，相比较于直接cleanuEffect提升了较多性能。 
```

- 编译器
```
主要通过三个阶段的编译过程
```
- [x] ast
- [x] transform
  - [x] transformElement
  - [x] transformText
  - [x] transformIf
  - [x] transformFor
  - [x] transformOn
  - [x] transformBind
- [x] generate


- 渲染器
```
vue3使用快速diff算法实现dom最小化更新
```
- [x] 简单diff
- [x] 双端diff
- [x] 快速diff
> diff算法的实现在runtim-core/diff中，文件分别对简单diff和双端diff以及快速diff做了实现，简单diff和双端diff实现基于《Vue.js的设计与实现》中代码实现，快速diff基于源码+《Vue.js的设计与实现》实现。
