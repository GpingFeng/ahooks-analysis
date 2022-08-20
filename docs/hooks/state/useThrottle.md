# useThrottle

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-throttle)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useThrottle/index.ts)

> 用来处理节流值的 Hook。

实现原理主要是调用 lodash 的 throttle 方法。

直接看代码，依赖于 [useThrottleFn](/hooks/effect/use-throttle-fn) 这个 hook。

```ts
function useThrottle<T>(value: T, options?: ThrottleOptions) {
  const [throttled, setThrottled] = useState(value);
  // 使用了处理节流函数的 hook
  const { run } = useThrottleFn(() => {
    setThrottled(value);
  }, options);

  // 当值变化的时候，重新 run
  useEffect(() => {
    run();
  }, [value]);

  return throttled;
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
