# useFocusWithin

> 监听当前焦点是否在某个区域之内，同 css 属性 [:focus-within](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within)。

实现原理主要是监听 [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) 和 [focusout](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/focusout_event) 方法。当元素即将失去焦点时，focusout 事件被触发。当元素即将聚焦时，focusin 事件被触发。它们和 focus 和 blur 方法的主要区别是后面两个不会进行冒泡。

直接上代码：

```ts
export default function useFocusWithin(target: BasicTarget, options?: Options) {
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { onFocus, onBlur, onChange } = options || {};

  // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within
  // 监听 focusin 和 focusout
  useEventListener(
    'focusin',
    (e: FocusEvent) => {
      if (!isFocusWithin) {
        // 获取焦点时触发
        onFocus?.(e);
        // 焦点变化时触发
        onChange?.(true);
        setIsFocusWithin(true);
      }
    },
    {
      target,
    },
  );

  useEventListener(
    'focusout',
    (e: FocusEvent) => {
      // @ts-ignore
      if (isFocusWithin && !e.currentTarget?.contains?.(e.relatedTarget)) {
        // 失去焦点时触发
        onBlur?.(e);
        onChange?.(false);
        setIsFocusWithin(false);
      }
    },
    {
      target,
    },
  );

  return isFocusWithin;
}
```
