# useDebounce

> 用来处理防抖值的 Hook。

实现原理主要是调用 lodash 的 debounce 方法。

直接看代码，依赖于 [useDebounceFn](/hooks/effect/use-debounce-fn) 这个 hook。

```ts
function useDebounce<T>(value: T, options?: DebounceOptions) {
  const [debounced, setDebounced] = useState(value);

  // 使用了处理防抖函数
  const { run } = useDebounceFn(() => {
    setDebounced(value);
  }, options);

  useEffect(() => {
    run();
  }, [value]);

  return debounced;
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
