# useMouse

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-mouse)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useMouse/index.ts)

> 监听鼠标位置。

主要实现原理是通过监听 [mousemove](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/mousemove_event) 方法，获取鼠标的位置。并通过 getBoundingClientRect 获取到 target 元素的问题，从而计算出鼠标相对于元素的位置。

> 当指针设备 ( 通常指鼠标 ) 在元素上移动时，mousemove 事件被触发。

具体返回值 ts 定义(详细请看官网)：

```ts
export interface CursorState {
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  elementX: number;
  elementY: number;
  elementH: number;
  elementW: number;
  elementPosX: number;
  elementPosY: number;
}
```

整体代码比较简单，可以直接贴上：

```typescript
export default (target?: BasicTarget) => {
  const [state, setState] = useRafState(initState);

  // 监听 mousemove
  useEventListener(
    'mousemove',
    (event: MouseEvent) => {
      const { screenX, screenY, clientX, clientY, pageX, pageY } = event;
      const newState = {
        screenX,
        screenY,
        clientX,
        clientY,
        pageX,
        pageY,
        elementX: NaN,
        elementY: NaN,
        elementH: NaN,
        elementW: NaN,
        elementPosX: NaN,
        elementPosY: NaN,
      };
      const targetElement = getTargetElement(target);
      if (targetElement) {
        const {
          left,
          top,
          width,
          height,
        } = targetElement.getBoundingClientRect();
        // 计算鼠标相对于元素的位置
        newState.elementPosX = left + window.pageXOffset;
        newState.elementPosY = top + window.pageYOffset;
        newState.elementX = pageX - newState.elementPosX;
        newState.elementY = pageY - newState.elementPosY;
        newState.elementW = width;
        newState.elementH = height;
      }
      setState(newState);
    },
    {
      target: () => document,
    },
  );

  return state;
};
```
