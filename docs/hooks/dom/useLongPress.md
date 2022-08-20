# useLongPress

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-long-press)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useLongPress/index.ts)

> 监听目标元素的长按事件。

其主要原理是判断当前是否支持 touch 事件，假如支持，则监听 touchstart 和 touchend 事件。假如不支持，则监听 mousedown、mouseup 和 mouseleave 事件。根据定时器设置标识，判断是否达到长按，触发回调，从而实现长按事件。

判断是否支持 touch 事件：

```ts
// 判断是否支持 touch 事件
const touchSupported =
  isBrowser &&
  // @ts-ignore
  ('ontouchstart' in window ||
    (window.DocumentTouch && document instanceof DocumentTouch));
```

根据是否支持 touch 事件，监听不同的事件以及卸载时候，清除对应事件。

```ts
// 看支不支持 touch 事件，不支持，则监听 mousedown 、mouseup、mouseleave
if (!touchSupported) {
  targetElement.addEventListener('mousedown', onStart);
  targetElement.addEventListener('mouseup', onEndWithClick);
  targetElement.addEventListener('mouseleave', onEnd);
} else {
  targetElement.addEventListener('touchstart', onStart);
  targetElement.addEventListener('touchend', onEndWithClick);
}

return () => {
  // 清除定时器
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    isTriggeredRef.current = false;
  }
  // 清除对应事件
  if (!touchSupported) {
    targetElement.removeEventListener('mousedown', onStart);
    targetElement.removeEventListener('mouseup', onEndWithClick);
    targetElement.removeEventListener('mouseleave', onEnd);
  } else {
    targetElement.removeEventListener('touchstart', onStart);
    targetElement.removeEventListener('touchend', onEndWithClick);
  }
};
```

开始事件、结束事件。留意在 onStart 中设置了定时器，只有定时器执行完之后 isTriggeredRef.current 才会设置为 true。在结束的时候，会判断该值，假如为 false，则不触发长按事件。

```ts
// 开始
const onStart = (event: TouchEvent | MouseEvent) => {
  timerRef.current = setTimeout(() => {
    onLongPressRef.current(event);
    isTriggeredRef.current = true;
    // delay - 	长按时间
  }, delay);
};
// 结束
const onEnd = (
  event: TouchEvent | MouseEvent,
  shouldTriggerClick: boolean = false,
) => {
  // 先 clear 开始的定时器
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }
  // 判断是否达到长按时间
  if (isTriggeredRef.current) {
    onLongPressEndRef.current?.(event);
  }
  // 是否触发 onClick 事件
  if (shouldTriggerClick && !isTriggeredRef.current && onClickRef.current) {
    onClickRef.current(event);
  }
  isTriggeredRef.current = false;
};

// 结束
const onEndWithClick = (event: TouchEvent | MouseEvent) => onEnd(event, true);
```
