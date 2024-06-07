# useMemoizedFn

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-memoized-fn)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useMemoizedFn/index.ts)

> 持久化 function 的 Hook，理论上，可以使用 useMemoizedFn 完全代替 useCallback。

实现原理是通过 useRef 保持 function 引用地址不变，并且每次执行都可以拿到最新的 state 值。

```ts
function useMemoizedFn<T extends noop>(fn: T) {
  // 通过 useRef 保持其引用地址不变，并且值能够保持值最新
  const fnRef = useRef<T>(fn);
  fnRef.current = useMemo(() => fn, [fn]);
  // 通过 useRef 保持其引用地址不变，并且值能够保持值最新
  const memoizedFn = useRef<PickFunction<T>>();
  if (!memoizedFn.current) {
    // 返回的持久化函数，调用该函数的时候，调用原始的函数
    memoizedFn.current = function(this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
```

想了解更多，可以查看[这篇 blog](/guide/blog/closure.md)。
