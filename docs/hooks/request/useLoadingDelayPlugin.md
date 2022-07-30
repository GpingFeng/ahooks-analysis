# Loading Delay

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

> 官方文档：通过设置 options.loadingDelay ，可以延迟 loading 变成 true 的时间，有效防止闪烁。

# useLoadingDelayPlugin

这个功能主要是通过 useLoadingDelayPlugin 插件实现。其原理在 onBefore 也就是请求前阶段，通过 setTimeout 实现延迟 loading 的时间。

核心代码如下：

```ts
// 在请求前调用
onBefore: () => {
  // 清除定时器
  cancelTimeout();
  // 通过 setTimeout 实现延迟 loading 的时间
  timerRef.current = setTimeout(() => {
    fetchInstance.setState({
      loading: true,
    });
  }, loadingDelay);

  return {
    loading: false,
  };
},
```

这里学习一下 setTimeout 定时器的返回值类型定义：

```ts
// 定时器返回值
export type Timeout = ReturnType<typeof setTimeout>;
```
