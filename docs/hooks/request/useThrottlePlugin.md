# 防抖 & 节流

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

防抖和节流在 ahooks 中底层都是使用 lodash（YYDS）去实现。

## 文档以及代码

文档地址：

- [防抖](https://ahooks.js.org/zh-CN/hooks/use-request/debounce)
- [节流](https://ahooks.js.org/zh-CN/hooks/use-request/throttle)

详细代码：

- [防抖](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/plugins/useDebouncePlugin.ts)
- [节流](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/plugins/useThrottlePlugin.ts)

## 防抖

其核心实现如下：

```ts
useEffect(() => {
  if (debounceWait) {
    // 保存异步执行的结果
    const _originRunAsync = fetchInstance.runAsync.bind(fetchInstance);

    // 使用 lodash 的防抖
    // 该函数提供一个 cancel 方法取消延迟的函数调用
    debouncedRef.current = debounce(
      callback => {
        callback();
      },
      debounceWait,
      options,
    );

    // debounce runAsync should be promise
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
    // 函数劫持，改写了 runAsync 方法，使其具有防抖能力
    fetchInstance.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        debouncedRef.current?.(() => {
          // 执行原函数
          _originRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };

    // React 会在执行当前 effect 之前对上一个 effect 进行清除
    return () => {
      debouncedRef.current?.cancel();
      // 还原最开始的函数
      fetchInstance.runAsync = _originRunAsync;
    };
  }
}, [debounceWait, options]);
```

这里用到了函数劫持小技巧。一般会分为三步：

- 保存原函数。比如这里保存原函数 fetchInstance.runAsync 为 \_originRunAsync。
- 改写原函数。这里改写原函数 fetchInstance.runAsync，加入我们需要的防抖逻辑。
- 在改写函数中执行原函数。

对函数劫持感兴趣，可以看我这篇[博客](https://juejin.cn/post/7103837916274622494)。

除了函数劫持，我们可以发现，可以在 useEffect 的返回值中 cancel 掉防抖以及还原原函数。

## 节流

节流跟防抖实现上基本一样，我们就直接看代码：

```ts
useEffect(() => {
  if (throttleWait) {
    // 函数劫持
    // 1 - 保留原函数
    const _originRunAsync = fetchInstance.runAsync.bind(fetchInstance);

    // 创建节流函数，该函数提供一个 cancel 方法取消延迟的函数调用以及 flush 方法立即调用。
    throttledRef.current = throttle(
      callback => {
        callback();
      },
      throttleWait,
      options,
    );

    // 2 - 改写原有的函数
    // throttle runAsync should be promise
    // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
    fetchInstance.runAsync = (...args) => {
      return new Promise((resolve, reject) => {
        // 节流函数，对原有函数进行节流
        throttledRef.current?.(() => {
          // 3 - 执行原有函数
          _originRunAsync(...args)
            .then(resolve)
            .catch(reject);
        });
      });
    };
    // 清除上一次 effect
    return () => {
      // 还原函数
      fetchInstance.runAsync = _originRunAsync;
      // 取消节流
      throttledRef.current?.cancel();
    };
  }
}, [throttleWait, throttleLeading, throttleTrailing]);
```
