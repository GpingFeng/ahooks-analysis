# useDrop & useDrag

> 处理元素拖拽的 Hook。

- useDrop 可以单独使用来接收文件、文字和网址的拖拽。

- useDrag 允许一个 DOM 节点被拖拽，需要配合 useDrop 使用。

- 向节点内触发粘贴动作也会被视为拖拽

### useDrop

> [dragenter](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/dragenter_event): 当拖动的元素或被选择的文本进入有效的放置目标时， dragenter 事件被触发。

> [dragover](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/dragover_event): 当元素或者选择的文本被拖拽到一个有效的放置目标上时，触发 dragover 事件（每几百毫秒触发一次）。

> [dragleave](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/dragleave_event): 当一个被拖动的元素或者被选择的文本离开一个有效的拖放目标时，将会触发 dragleave 事件。

> [drop](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/drop_event):当一个元素或是选中的文字被拖拽释放到一个有效的释放目标位置时，drop 事件被抛出。

> [paste](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/paste_event): 当用户在浏览器用户界面发起“粘贴”操作时，会触发 paste 事件。

> [DataTransfer](https://developer.mozilla.org/zh-CN/docs/Web/API/DataTransfer): DataTransfer 对象用于保存拖动并放下（drag and drop）过程中的数据。它可以保存一项或多项数据，这些数据项可以是一种或者多种数据类型。关于拖放的更多信息，请参见 Drag and Drop.

useDrop 其实现原理就是监听以上的事件，进行特定的处理。其中在 drop 和 paste 事件中，获取到 DataTransfer 数据，并根据数据类型进行特定的处理。

主函数如下所示：

```ts
// useDrop 可以单独使用来接收文件、文字和网址的拖拽。
const useDrop = (target: BasicTarget, options: Options = {}) => {
  const optionsRef = useLatest(options);
  // https://stackoverflow.com/a/26459269
  const dragEnterTarget = useRef<any>();

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target);
      if (!targetElement?.addEventListener) {
        return;
      }

      const onData = (
        dataTransfer: DataTransfer,
        event: React.DragEvent | React.ClipboardEvent,
      ) => {};

      const onDragEnter = (event: React.DragEvent) => {};

      const onDragOver = (event: React.DragEvent) => {};

      const onDragLeave = (event: React.DragEvent) => {};

      const onDrop = (event: React.DragEvent) => {};

      const onPaste = (event: React.ClipboardEvent) => {
        // DataTransfer 对象用于保存拖动并放下（drag and drop）过程中的数据。它可以保存一项或多项数据，这些数据项可以是一种或者多种数据类型。关于拖放的更多信息，请参见 Drag and Drop.
        onData(event.clipboardData, event);
        // 粘贴内容的回调
        optionsRef.current.onPaste?.(event);
      };
      targetElement.addEventListener('dragenter', onDragEnter as any);
      targetElement.addEventListener('dragover', onDragOver as any);
      targetElement.addEventListener('dragleave', onDragLeave as any);
      targetElement.addEventListener('drop', onDrop as any);
      targetElement.addEventListener('paste', onPaste as any);

      return () => {
        targetElement.removeEventListener('dragenter', onDragEnter as any);
        targetElement.removeEventListener('dragover', onDragOver as any);
        targetElement.removeEventListener('dragleave', onDragLeave as any);
        targetElement.removeEventListener('drop', onDrop as any);
        targetElement.removeEventListener('paste', onPaste as any);
      };
    },
    [],
    target,
  );
};
```

其中对 5 个事件的处理分别如下：

```ts
const onDragEnter = (event: React.DragEvent) => {
  // 阻止默认事件
  event.preventDefault();
  // 阻止事件冒泡
  event.stopPropagation();
  dragEnterTarget.current = event.target;
  // 拖拽进入
  optionsRef.current.onDragEnter?.(event);
};

const onDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  // 拖拽中
  optionsRef.current.onDragOver?.(event);
};

const onDragLeave = (event: React.DragEvent) => {
  if (event.target === dragEnterTarget.current) {
    // 拖拽出去
    optionsRef.current.onDragLeave?.(event);
  }
};

const onDrop = (event: React.DragEvent) => {
  event.preventDefault();
  onData(event.dataTransfer, event);
  // 拖拽任意内容的回调
  optionsRef.current.onDrop?.(event);
};

const onPaste = (event: React.ClipboardEvent) => {
  // DataTransfer 对象用于保存拖动并放下（drag and drop）过程中的数据。它可以保存一项或多项数据，这些数据项可以是一种或者多种数据类型。关于拖放的更多信息，请参见 Drag and Drop.
  onData(event.clipboardData, event);
  // 粘贴内容的回调
  optionsRef.current.onPaste?.(event);
};
```

其中在 drop 和 paste 事件中，获取到 DataTransfer 数据，调用 onData 方法，并根据数据类型进行特定的处理。

```ts
const onData = (
  dataTransfer: DataTransfer,
  event: React.DragEvent | React.ClipboardEvent,
) => {
  const uri = dataTransfer.getData('text/uri-list');
  const dom = dataTransfer.getData('custom');

  // 拖拽/粘贴自定义 DOM 节点的回调
  if (dom && optionsRef.current.onDom) {
    let data = dom;
    try {
      data = JSON.parse(dom);
    } catch (e) {
      data = dom;
    }
    optionsRef.current.onDom(data, event as React.DragEvent);
    return;
  }

  // 拖拽/粘贴链接的回调
  if (uri && optionsRef.current.onUri) {
    optionsRef.current.onUri(uri, event as React.DragEvent);
    return;
  }

  // 拖拽/粘贴文件的回调
  if (
    dataTransfer.files &&
    dataTransfer.files.length &&
    optionsRef.current.onFiles
  ) {
    optionsRef.current.onFiles(
      Array.from(dataTransfer.files),
      event as React.DragEvent,
    );
    return;
  }

  // 拖拽/粘贴文字的回调
  if (
    dataTransfer.items &&
    dataTransfer.items.length &&
    optionsRef.current.onText
  ) {
    dataTransfer.items[0].getAsString(text => {
      optionsRef.current.onText!(text, event as React.ClipboardEvent);
    });
  }
};
```

### useDrag

> [dragstart](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/dragstart_event): 当用户开始拖动一个元素或者一个选择文本的时候 dragstart 事件就会触发。

> [dragend](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/dragend_event): 拖放事件在拖放操作结束时触发 (通过释放鼠标按钮或单击 escape 键)。

useDrag 主要实现原理监听 dragstart 和 dragend 方法，将值设置进 dataTransfer 中，并触发相应的回调。代码比较简单，直接看代码：

```ts
const useDrag = <T>(data: T, target: BasicTarget, options: Options = {}) => {
  const optionsRef = useLatest(options);

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target);
      if (!targetElement?.addEventListener) {
        return;
      }

      const onDragStart = (event: React.DragEvent) => {
        optionsRef.current.onDragStart?.(event);
        // 设置自定义数据。
        event.dataTransfer.setData('custom', JSON.stringify(data));
      };

      const onDragEnd = (event: React.DragEvent) => {
        optionsRef.current.onDragEnd?.(event);
      };

      targetElement.setAttribute('draggable', 'true');

      targetElement.addEventListener('dragstart', onDragStart as any);
      targetElement.addEventListener('dragend', onDragEnd as any);

      return () => {
        targetElement.removeEventListener('dragstart', onDragStart as any);
        targetElement.removeEventListener('dragend', onDragEnd as any);
      };
    },
    [],
    target,
  );
};
```
