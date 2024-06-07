# useTrackedEffect

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-tracked-effect)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useTrackedEffect/index.ts)

> 追踪是哪个依赖变化触发了 useEffect 的执行。

主要实现原理，通过 uesRef 记录上一次依赖的值，并在当前执行的时候，判断当前依赖值和上次依赖值之间的 diff 值。

主函数：

```ts
const useTrackedEffect = (effect: Effect, deps?: DependencyList) => {
  // 记录上次依赖
  const previousDepsRef = useRef<DependencyList>();

  useEffect(() => {
    // 判断依赖的 changes
    const changes = diffTwoDeps(previousDepsRef.current, deps);
    // 上次依赖
    const previousDeps = previousDepsRef.current;
    previousDepsRef.current = deps;
    return effect(changes, previousDeps, deps);
  }, deps);
};
```

diffTwoDeps 方法如下，可以直接看代码：

```ts
const diffTwoDeps = (deps1?: DependencyList, deps2?: DependencyList) => {
  //Let's do a reference equality check on 2 dependency list.
  // 让我们对2个依赖项列表做一个引用相等性检查。
  //If deps1 is defined, we iterate over deps1 and do comparison on each element with equivalent element from deps2
  // 如果定义了deps1，则遍历deps1并将每个元素与来自deps2的等效元素进行比较
  //As this func is used only in this hook, we assume 2 deps always have same length.
  // 因为这个func只在这个钩子中使用，所以我们假设2个deps的长度总是相同的。
  return deps1
    ? deps1
        .map((_ele, idx) => (!Object.is(deps1[idx], deps2?.[idx]) ? idx : -1))
        .filter(ele => ele >= 0)
    : deps2
    ? deps2.map((_ele, idx) => idx)
    : [];
};
```
