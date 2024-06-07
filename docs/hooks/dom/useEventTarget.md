# useEventTarget

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-event-target)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useEventTarget/index.ts)

> 常见表单控件(通过 e.target.value 获取表单值) 的 onChange 跟 value 逻辑封装，支持自定义值转换和重置功能。

直接看代码，比较简单，其实就是监听表单的 onChange 事件，拿到值后更新 value 值，更新的逻辑支持自定义。

```ts
function useEventTarget<T, U = T>(options?: Options<T, U>) {
  const { initialValue, transformer } = options || {};
  const [value, setValue] = useState(initialValue);
  // 自定义转换函数
  const transformerRef = useLatest(transformer);
  const reset = useCallback(() => setValue(initialValue), []);
  const onChange = useCallback((e: EventTarget<U>) => {
    // 获取 e.target.value 的值，并进行设置
    const _value = e.target.value;
    if (isFunction(transformerRef.current)) {
      return setValue(transformerRef.current(_value));
    }
    // no transformer => U and T should be the same
    return setValue((_value as unknown) as T);
  }, []);

  return [
    value,
    {
      onChange,
      reset,
    },
  ] as const;
}
```
