# useScroll

> 监听元素的滚动位置。

实现原理是通过监听目标的 scroll 的事件，更新目标位置信息。

主函数代码：

```ts
function useScroll(
  target?: Target,
  shouldUpdate: ScrollListenController = () => true,
): Position | undefined {
  const [position, setPosition] = useRafState<Position>();

  const shouldUpdateRef = useLatest(shouldUpdate);

  useEffectWithTarget(
    () => {
      const el = getTargetElement(target, document);
      if (!el) {
        return;
      }
      // 更新位置
      const updatePosition = () => {
        // ...单独拿出来讲
      };
      updatePosition();
      // 监听 scroll 事件
      el.addEventListener('scroll', updatePosition);
      return () => {
        el.removeEventListener('scroll', updatePosition);
      };
    },
    [],
    target,
  );

  return position;
}
```

主要看更新函数，留意当为 document 的时候，当在怪异模式下， scrollingElement 属性返回 HTML body 元素（若不存在返回 null ）。这个时候可以取 window.pageYOffset, document.documentElement.scrollTop, document.body.scrollTop 三者中最大值。[参考](https://stackoverflow.com/questions/28633221/document-body-scrolltop-firefox-returns-0-only-js)。

```ts
// 更新位置
const updatePosition = () => {
  let newPosition: Position;
  // 如果是 document 的处理
  if (el === document) {
    if (document.scrollingElement) {
      newPosition = {
        left: document.scrollingElement.scrollLeft,
        top: document.scrollingElement.scrollTop,
      };
    } else {
      // When in quirks mode, the scrollingElement attribute returns the HTML body element if it exists and is potentially scrollable, otherwise it returns null.
      // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/scrollingElement
      // https://stackoverflow.com/questions/28633221/document-body-scrolltop-firefox-returns-0-only-js
      newPosition = {
        left: Math.max(
          window.pageYOffset,
          document.documentElement.scrollTop,
          document.body.scrollTop,
        ),
        top: Math.max(
          window.pageXOffset,
          document.documentElement.scrollLeft,
          document.body.scrollLeft,
        ),
      };
    }
  } else {
    // 获取到元素的位置
    newPosition = {
      left: (el as Element).scrollLeft,
      top: (el as Element).scrollTop,
    };
  }
  // 是否更新位置信息函数
  if (shouldUpdateRef.current(newPosition)) {
    setPosition(newPosition);
  }
};
```
