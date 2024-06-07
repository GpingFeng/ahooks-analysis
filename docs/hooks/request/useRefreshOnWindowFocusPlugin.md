# 屏幕聚焦重新请求

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

> 通过设置 options.refreshOnWindowFocus，在浏览器窗口 refocus 和 revisible 时，会重新发起请求。其中 focusTimespan 设置重新请求间隔，单位为毫秒。

## 文档以及代码

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-request/refresh-on-window-focus)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/plugins/useRefreshOnWindowFocusPlugin.ts)

## useRefreshOnWindowFocusPlugin

该功能主要是由 useRefreshOnWindowFocusPlugin 插件完成。

其主要实现代码如下，可以看到 options.refreshOnWindowFocus、options.focusTimespan 支持动态变化。每次变化的时候，都会执行判断以及监听逻辑。

```ts
useEffect(() => {
  // 只有为 true 的时候，这个功能才生效
  if (refreshOnWindowFocus) {
    // 根据 focusTimespan，判断是否进行请求
    const limitRefresh = limit(
      fetchInstance.refresh.bind(fetchInstance),
      focusTimespan,
    );
    // 存放在事件订阅列表中
    unsubscribeRef.current = subscribeFocus(() => {
      limitRefresh();
    });
  }
  return () => {
    stopSubscribe();
  };
}, [refreshOnWindowFocus, focusTimespan]);
```

其中监听逻辑，subscribeFocus 其原理跟我们在[轮询](/hooks/request/use-polling-plugin) 对 subscribeReVisible.ts 文件的原理很类似。它的代码在 [subscribeFocus.ts](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/utils/subscribeFocus.ts) 文件中。其主要原理是通过 subscribe 订阅事件，并通过监 visibilitychange 和 focus 事件执行订阅器中的事件实现，可以直接看代码：

```ts
import canUseDom from '../../../utils/canUseDom';
import isDocumentVisible from './isDocumentVisible';
import isOnline from './isOnline';

const listeners: any[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}

if (canUseDom()) {
  const revalidate = () => {
    // dom 不可见，或者断网的时候
    if (!isDocumentVisible() || !isOnline()) return;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };
  // 监听 visibilitychange 和 focus 事件
  window.addEventListener('visibilitychange', revalidate, false);
  window.addEventListener('focus', revalidate, false);
}

export default subscribe;
```

重点看 limit 函数。其入参为 fn 函数，timespan（时间，毫秒），主要限制在 timespan 时间内，不会再次执行 fn 函数。其实就是使用闭包的一个简易版节流函数。

```ts
export default function limit(fn: any, timespan: number) {
  // 设置一个标识位，标识还在 pending 阶段，不应该进行请求
  let pending = false;
  return (...args: any[]) => {
    // 假如正处于 pending，则直接返回
    if (pending) return;
    pending = true;
    fn(...args);
    setTimeout(() => {
      // 标识位置为 false，允许请求
      pending = false;
    }, timespan);
  };
}
```
