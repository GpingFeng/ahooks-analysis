# useEventEmitter

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-event-emitter)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useEventEmitter/index.ts)

> 在多个组件之间进行事件通知有时会让人非常头疼，借助 EventEmitter ，可以让这一过程变得更加简单。

> 对于子组件通知父组件的情况，我们仍然推荐直接使用 props 传递一个 onEvent 函数。而对于父组件通知子组件的情况，可以使用 forwardRef 获取子组件的 ref ，再进行子组件的方法调用。 useEventEmitter 适合的是在距离较远的组件之间进行事件通知，或是在多个组件之间共享事件通知。

主要是通过发布订阅设计模式实现。

看主要的类实现 EventEmitter，维护 subscriptions Set 结构存放事件列表。useSubscription 订阅事件，通过 emit 方法推送事件。

```ts
export class EventEmitter<T> {
  private subscriptions = new Set<Subscription<T>>();

  // 推送事件
  emit = (val: T) => {
    // 触发订阅器列表中所有事件
    for (const subscription of this.subscriptions) {
      subscription(val);
    }
  };

  // 订阅事件
  useSubscription = (callback: Subscription<T>) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const callbackRef = useRef<Subscription<T>>();
    callbackRef.current = callback;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // 待订阅事件
      function subscription(val: T) {
        if (callbackRef.current) {
          callbackRef.current(val);
        }
      }
      // 添加到订阅事件队列中
      this.subscriptions.add(subscription);
      // 卸载的时候自动卸载
      return () => {
        this.subscriptions.delete(subscription);
      };
    }, []);
  };
}
```

主函数实现如下:

```ts
export default function useEventEmitter<T = void>() {
  const ref = useRef<EventEmitter<T>>();
  if (!ref.current) {
    ref.current = new EventEmitter();
  }
  return ref.current;
}
```
