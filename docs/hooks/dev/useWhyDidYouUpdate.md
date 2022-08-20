# useWhyDidYouUpdate

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-why-did-you-update)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useWhyDidYouUpdate/index.ts)

> 帮助开发者排查是那个属性改变导致了组件的 rerender。

主要实现原理是通过 useEffect 拿到上一次 props 和当前的 props 进行比较。得到值改变的 changedProps，可以直接看代码：

```ts
export default function useWhyDidYouUpdate(
  componentName: string,
  props: IProps,
) {
  const prevProps = useRef<IProps>({});

  useEffect(() => {
    if (prevProps.current) {
      // 获取到所有的 keys
      const allKeys = Object.keys({ ...prevProps.current, ...props });
      const changedProps: IProps = {};

      // 看哪些 key 进行了更新
      allKeys.forEach(key => {
        // 通过 Object.is 判断是否进行更新
        if (!Object.is(prevProps.current[key], props[key])) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
        }
      });

      // 有 diff，则输出
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', componentName, changedProps);
      }
    }

    // 记录上一次的值
    prevProps.current = props;
  });
}
```
