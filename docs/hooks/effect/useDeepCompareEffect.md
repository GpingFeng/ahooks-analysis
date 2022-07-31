# useDeepCompareEffect 和 useDeepCompareLayoutEffect

> 用法与 useEffect 一致，但 deps 通过 lodash isEqual 进行深比较。

通过 useRef 保存上一次的依赖的值，跟当前的依赖对比（使用 lodash 的 isEqual），并将对比结果作为 useEffect 的依赖项，从而决定回调函数是否执行。

```js
const depsEqual = (aDeps: DependencyList, bDeps: DependencyList = []) => {
  return isEqual(aDeps, bDeps);
};

const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
  // 通过 useRef 保存上一次的依赖的值
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  // 判断最新的依赖和旧的区别
  // 如果相等，则变更 signalRef.current，从而触发 useEffect 中的回调
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  useEffect(effect, [signalRef.current]);
};
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
