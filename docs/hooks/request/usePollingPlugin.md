# 轮询

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

> 通过设置 options.pollingInterval，进入轮询模式，useRequest 会定时触发 service 执行。

## usePollingPlugin

该功能主要由 usePollingPlugin 这个插件实现。

其主要的原理是在 onFinally 阶段，通过定时器 setTimeout 进行轮询。

```ts
onFinally: () => {
  // 省略部分逻辑
  // ...
  // 通过 setTimeout 进行轮询
  timerRef.current = setTimeout(() => {
    fetchInstance.refresh();
  }, pollingInterval);
},
```

另外还有一个逻辑，pollingWhenHidden。该参数代表在页面隐藏时，是否继续轮询。如果设置为 false，在页面隐藏时会暂时停止轮询，页面重新显示时继续上次轮询。

```ts
// 假如 pollingWhenHidden = false，在页面隐藏时会暂时停止轮询
// if pollingWhenHidden = false && document is hidden, then stop polling and subscribe revisible
if (!pollingWhenHidden && !isDocumentVisible()) {
  // 返回的是清楚订阅事件的列表
  unsubscribeRef.current = subscribeReVisible(() => {
    // 进行请求
    fetchInstance.refresh();
  });
  return;
}
```

其中 isDocumentVisible 方法是用来判断 document 是否可见。如下，主要使用了 document.visibilityState 方法进行判断。详见 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilityState)

> Document.visibilityState （只读属性）, 返回 document 的可见性, 即当前可见元素的上下文环境. 由此可以知道当前文档(即为页面)是在背后, 或是不可见的隐藏的标签页，或者(正在)预渲染

```ts
export default function isDocumentVisible(): boolean {
  if (canUseDom()) {
    //  Document.visibilityState （只读属性）, 返回document的可见性, 即当前可见元素的上下文环境. 由此可以知道当前文档(即为页面)是在背后, 或是不可见的隐藏的标签页，或者(正在)预渲染
    // 'hidden' : 此时页面对用户不可见. 即文档处于背景标签页或者窗口处于最小化状态，或者操作系统正处于 '锁屏状态' .
    return document.visibilityState !== 'hidden';
  }
  return true;
}
```

假如页面不可见的时候，通过 subscribeReVisible 函数进行订阅。其逻辑在 `packages/hooks/src/useRequest/src/utils/subscribeReVisible.ts` 中。

```ts
import canUseDom from '../../../utils/canUseDom';
import isDocumentVisible from './isDocumentVisible';
// 1.维护一个事件队列。全局变量，存放订阅的事件
const listeners: any[] = [];
// 2.订阅事件
function subscribe(listener: () => void) {
  listeners.push(listener);
  // 返回取消订阅函数
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}

if (canUseDom()) {
  // 4.执行所有事件队列中的事件
  const revalidate = () => {
    // dom 不可见
    if (!isDocumentVisible()) return;
    // dom 可见的时候，执行所有的事件
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };
  // 3.监听 visibilitychange
  // 当其选项卡的内容变得可见或被隐藏时，会在文档上触发 visibilitychange (能见度更改)事件。
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event
  window.addEventListener('visibilitychange', revalidate, false);
}

export default subscribe;
```

其逻辑主要分为以下几步：

- 维护一个事件队列。
- subscribe 订阅事件，往事件队列末尾添加事件。并返回取消订阅函数。
- 监听 visibilitychange 方法。当其选项卡的内容变得可见或被隐藏时，会在文档上触发 [visibilitychange](https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event) (能见度更改)事件。
- 执行所有事件队列中的事件。

除以上功能除外，现版本 3.6.2 版本已有一个 轮询错误重试次数（pollingErrorRetryCount）。这个可以看我给 ahooks 的第一次 [PR](https://github.com/alibaba/hooks/pull/1657)。
