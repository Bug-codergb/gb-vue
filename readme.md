## gb-vue

huochunyang-mini-vue对于《Vuejs设计与实现》实现思路,在mini-vue中是对于另一个库《mini-vue》+ vue3源码的实现,将vue3源码逻辑抽离出来但又保证主要实现逻辑。

##

- 响应式
```
响应式是vue3的核心，是我门学习vue3的一个重点，相比较于vue2，vue3通过proxy实现数据劫持。
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
