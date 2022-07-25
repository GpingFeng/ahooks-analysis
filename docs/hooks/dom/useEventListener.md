# useEventListener

> 优雅的使用 addEventListener。

我们先来看看 addEventListener 的定义，以下来自 MDN 文档：

> EventTarget.addEventListener() 方法将指定的监听器注册到 EventTarget 上，当该对象触发指定的事件时，指定的回调函数就会被执行。

这里的 EventTarget 可以是一个文档上的元素 Element,Document 和 Window 或者任何其他支持事件的对象 (比如 XMLHttpRequest)。

我们看 useEventListener 函数 TypeScript 定义，通过类型重载，它对 Element、Document、Window 等元素以及其事件名称和回调参数都做了定义。

```ts
function useEventListener<K extends keyof HTMLElementEventMap>(
  eventName: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
  options?: Options<HTMLElement>,
): void;
function useEventListener<K extends keyof ElementEventMap>(
  eventName: K,
  handler: (ev: ElementEventMap[K]) => void,
  options?: Options<Element>,
): void;
function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (ev: DocumentEventMap[K]) => void,
  options?: Options<Document>,
): void;
function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (ev: WindowEventMap[K]) => void,
  options?: Options<Window>,
): void;
function useEventListener(
  eventName: string,
  handler: noop,
  options: Options,
): void;
```

内部代码比较简单：

- 判断是否支持 addEventListener，支持则将参数进行传递。可以留意注释中的几个参数的作用，当做复习，这里不展开细说。
- useEffect 的返回逻辑，也就是组件卸载的时候，会自动清除事件监听器，避免产生内存泄露。

```typescript
function useEventListener(
  // 事件名称
  eventName: string,
  // 处理函数
  handler: noop,
  // 设置
  options: Options = {},
) {
  const handlerRef = useLatest(handler);

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(options.target, window);
      if (!targetElement?.addEventListener) {
        return;
      }

      const eventListener = (event: Event) => {
        return handlerRef.current(event);
      };

      // 监听事件
      targetElement.addEventListener(eventName, eventListener, {
        // listener 会在该类型的事件捕获阶段传播到该 EventTarget 时触发。
        capture: options.capture,
        // listener 在添加之后最多只调用一次。如果是 true，listener 会在其被调用之后自动移除。
        once: options.once,
        // 设置为 true 时，表示 listener 永远不会调用 preventDefault() 。如果 listener 仍然调用了这个函数，客户端将会忽略它并抛出一个控制台警告
        passive: options.passive,
      });

      // 移除事件
      return () => {
        targetElement.removeEventListener(eventName, eventListener, {
          capture: options.capture,
        });
      };
    },
    [eventName, options.capture, options.once, options.passive],
    options.target,
  );
}
```
