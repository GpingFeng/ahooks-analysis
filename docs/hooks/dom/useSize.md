# useSize

> 监听 DOM 节点尺寸变化的 Hook。

主要实现原理就是使用 ResizeObserver API 监听对应的目标的尺寸变化。

代码比较简单，可以直接看：

```ts
function useSize(
  // 目标 DOM
  target: BasicTarget,
): Size | undefined {
  const [state, setState] = useRafState<Size>();

  useIsomorphicLayoutEffectWithTarget(
    () => {
      // 获取到当前目标元素
      const el = getTargetElement(target);
      if (!el) {
        return;
      }
      const resizeObserver = new ResizeObserver(entries => {
        // 监听的 DOM 大小发生变化的时候，则获取到最新的值
        entries.forEach(entry => {
          // DOM 节点的尺寸
          const { clientWidth, clientHeight } = entry.target;
          setState({
            width: clientWidth,
            height: clientHeight,
          });
        });
      });
      // 监听目标的元素
      resizeObserver.observe(el);
      // 销毁相应的事件，防止造成内存泄露
      return () => {
        resizeObserver.disconnect();
      };
    },
    // 依赖项
    [],
    // 目标元素
    target,
  );

  return state;
}
```
