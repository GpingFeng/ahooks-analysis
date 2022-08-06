# useDebounceFn

> 用来处理防抖函数的 Hook。

实现原理主要是调用 lodash 的 debounce 方法。

直接看代码：

```ts
function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(
        `useDebounceFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  // 默认是 1000 毫秒
  const wait = options?.wait ?? 1000;

  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        // options
        options,
      ),
    [],
  );

  // 卸载时候取消
  useUnmount(() => {
    debounced.cancel();
  });

  return {
    // 触发执行 fn，函数参数将会传递给 fn
    run: debounced,
    // 取消
    cancel: debounced.cancel,
    // flush 方法表示立即调用
    flush: debounced.flush,
  };
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
