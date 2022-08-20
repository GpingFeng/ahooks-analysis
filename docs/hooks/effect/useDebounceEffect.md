# useDebounceEffect

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-debounce-effect)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useDebounceEffect/index.ts)

> 为 useEffect 增加防抖的能力。

实现原理主要是调用 lodash 的 debounce 方法。

直接看代码，依赖于 [useDebounceFn](/hooks/effect/use-debounce-fn) 这个 hook。

```ts
function useDebounceEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  // 配置防抖的行为
  options?: DebounceOptions,
) {
  // 通过设置 flag 标识依赖，只有改变的时候，才会触发 useUpdateEffect 中的回调
  const [flag, setFlag] = useState({});

  // 为函数设置防抖功能
  const { run } = useDebounceFn(() => {
    setFlag({});
  }, options);

  useEffect(() => {
    return run();
  }, deps);

  // 只有在 flag 变化的时候，才执行逻辑
  useUpdateEffect(effect, [flag]);
}
```

想了解更多，可以查看[防抖和节流](/hooks/utils/debounce-and-throttle)
