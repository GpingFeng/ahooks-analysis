# useThrottleEffect

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-throttle-effect)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useThrottleEffect/index.ts)

> 为 useEffect 增加节流的能力。

实现原理主要是调用 lodash 的 throttle 方法。

直接看代码，依赖于 [useThrottleFn](/hooks/effect/use-throttle-fn) 这个 hook。

```ts
function useThrottleEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: ThrottleOptions,
) {
  // 通过设置 flag 标识依赖，只有改变的时候，才会触发 useUpdateEffect 中的回调
  const [flag, setFlag] = useState({});

  // 用来处理函数节流的 Hook。
  const { run } = useThrottleFn(() => {
    setFlag({});
  }, options);

  useEffect(() => {
    return run();
  }, deps);

  // 只有在 flag 变化的时候，才执行 effect 函数
  useUpdateEffect(effect, [flag]);
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
