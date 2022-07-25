# useHover

> 监听 DOM 元素是否有鼠标悬停。

主要实现原理是监听 `mouseenter` 触发 onEnter 事件，切换状态为 true，监听 `mouseleave` 触发 onLeave 事件，切换状态为 false。代码简单，如下：

```ts
export default (target: BasicTarget, options?: Options): boolean => {
  const { onEnter, onLeave } = options || {};
  const [state, { setTrue, setFalse }] = useBoolean(false);
  // 通过监听 mouseenter 判断有鼠标悬停
  useEventListener(
    'mouseenter',
    () => {
      onEnter?.();
      setTrue();
    },
    {
      target,
    },
  );

  // mouseleave 没有鼠标悬停
  useEventListener(
    'mouseleave',
    () => {
      onLeave?.();
      setFalse();
    },
    {
      target,
    },
  );

  return state;
};
```
