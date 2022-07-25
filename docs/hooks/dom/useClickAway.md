# useClickAway

> 监听目标元素外的点击事件。

提到这个的应用场景，应该是模态框，点击外部阴影部分，自动关闭的场景。那这里它是怎么实现的呢？

首先它支持传递 DOM 节点或者 Ref，并且是支持数组方式。
事件默认是支持 click，开发者可以自行传递并支持数组方式。

```typescript
export default function useClickAway<T extends Event = Event>(
  // 触发函数
  onClickAway: (event: T) => void,
  // DOM 节点或者 Ref，支持数组
  target: BasicTarget | BasicTarget[],
  // 指定需要监听的事件，支持数组
  eventName: string | string[] = 'click',
) {}
```

然后内部通过 document.addEventListener 监听事件。组件卸载的时候清除事件监听。

```ts
// 事件列表
const eventNames = Array.isArray(eventName) ? eventName : [eventName];
// document.addEventListener 监听事件，通过事件代理的方式知道目标节点
eventNames.forEach(event => document.addEventListener(event, handler));
return () => {
  eventNames.forEach(event => document.removeEventListener(event, handler));
};
```

最后看 handler 函数，通过 event.target 获取到触发事件的对象 (某个 DOM 元素) 的引用，判断假如不在传入的 target 列表中，则触发定义好的 onClickAway 函数。

```ts
const handler = (event: any) => {
  const targets = Array.isArray(target) ? target : [target];
  if (
    // 判断点击的 DOM Target 是否在定义的 DOM 元素（列表）中
    targets.some(item => {
      const targetElement = getTargetElement(item);
      return !targetElement || targetElement.contains(event.target);
    })
  ) {
    return;
  }
  // 触发点击事件
  onClickAwayRef.current(event);
};
```

小结一下，useClickAway 就是使用了事件代理的方式，通过 document 监听事件，判断触发事件的 DOM 元素是否在 target 列表中，从而决定是否要触发定义好的函数。
