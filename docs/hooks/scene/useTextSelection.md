# useTextSelection

> 实时获取用户当前选取的文本内容及位置。

其实现原理主要是监听 mouseup 和 mousedown 事件。调用 [window.getSelection() 方法](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getSelection) 获取到 Selection 对象，并通过 [getBoundingClientRect](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect) 方法获取到其位置信息。

> window.getSelection。返回一个 Selection 对象，表示用户选择的文本范围或光标的当前位置。

```ts
const selection = window.getSelection();
```

selection 是一个 Selection 对象。 如果想要将 selection 转换为字符串，可通过连接一个空字符串（""）或使用 String.toString() 方法。

监听和取消事件，在 mouseup 事件中，获取到选取的文本以及位置信息。在 mousedown 中清除之前的信息。

```ts
useEffectWithTarget(
  () => {
    const el = getTargetElement(target, document);
    if (!el) {
      return;
    }

    const mouseupHandler = () => {
      let selObj: Selection | null = null;
      let text = '';
      let rect = initRect;
      if (!window.getSelection) return;
      selObj = window.getSelection();
      text = selObj ? selObj.toString() : '';
      if (text) {
        rect = getRectFromSelection(selObj);
        setState({ ...state, text, ...rect });
      }
    };

    // 任意点击都需要清空之前的 range
    const mousedownHandler = () => {
      if (!window.getSelection) return;
      if (stateRef.current.text) {
        setState({ ...initState });
      }
      // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getSelection
      // 返回一个 Selection 对象，表示用户选择的文本范围或光标的当前位置。
      const selObj = window.getSelection();
      if (!selObj) return;
      // https://developer.mozilla.org/zh-CN/docs/Web/API/Selection/removeAllRanges
      // Selection.removeAllRanges() 方法会从当前 selection 对象中移除所有的 range 对象，取消所有的选择只 留下anchorNode 和focusNode属性并将其设置为 null。
      selObj.removeAllRanges();
    };

    // 监听 mouseup 和 mousedown
    el.addEventListener('mouseup', mouseupHandler);

    document.addEventListener('mousedown', mousedownHandler);

    return () => {
      el.removeEventListener('mouseup', mouseupHandler);
      document.removeEventListener('mousedown', mousedownHandler);
    };
  },
  [],
  // 目标元素
  target,
);
```

获取文本位置信息：

```ts
function getRectFromSelection(selection: Selection | null): Rect {
  if (!selection) {
    return initRect;
  }

  if (selection.rangeCount < 1) {
    return initRect;
  }
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Selection/getRangeAt
  // 返回一个包含当前选区内容的区域对象。
  const range = selection.getRangeAt(0);
  // 获取它的位置
  const {
    height,
    width,
    top,
    left,
    right,
    bottom,
  } = range.getBoundingClientRect();
  return {
    height,
    width,
    top,
    left,
    right,
    bottom,
  };
}
```
