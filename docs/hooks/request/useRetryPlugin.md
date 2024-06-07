# 错误重试

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

## 文档以及代码

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-request/retry)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/plugins/useRetryPlugin.ts)

## useRetryPlugin

错误重试功能主要由 useRetryPlugin 这个插件实现。

其主要原理就是在 onError 阶段，通过定时器发起重试。整体实现可以看以下注释。

```ts
onError: () => {
  countRef.current += 1;
  // 重试的次数小于设置的次数
  // 或者如果 retryCount 设置为 -1，则无限次重试。
  if (retryCount === -1 || countRef.current <= retryCount) {
    // Exponential backoff
    // 如果不设置，默认采用简易的指数退避算法，取 1000 * 2 ** retryCount，也就是第一次重试等待 2s，第二次重试等待 4s，以此类推，如果大于 30s，则取 30s
    const timeout = retryInterval ?? Math.min(1000 * 2 ** countRef.current, 30000);
    timerRef.current = setTimeout(() => {
      // 失败的时候置为 true，保证重试次数不重置
      triggerByRetry.current = true;
      // 重新请求
      fetchInstance.refresh();
    }, timeout);
  } else {
    // 重置为0，并且不再重试
    countRef.current = 0;
  }
},
```
