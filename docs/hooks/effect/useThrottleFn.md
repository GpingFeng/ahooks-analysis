# useThrottleFn

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-throttle-fn)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useThrottleFn/index.ts)

> 用来处理函数节流的 Hook。

实现原理主要是调用 lodash 的 throttle 方法。

直接看代码：

```ts
function useThrottleFn<T extends noop>(fn: T, options?: ThrottleOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(
        `useThrottleFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  const throttled = useMemo(
    () =>
      // 最终都是调用了 lodash 的节流函数
      throttle(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    // 取消
    cancel: throttled.cancel,
    // 立即调用
    flush: throttled.flush,
  };
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
