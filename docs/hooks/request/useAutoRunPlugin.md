# Ready & 依赖更新

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

## useAutoRunPlugin

Ready & 依赖更新主要由 useAutoRunPlugin 这个插件完成。

### Ready

> useRequest 提供了一个 options.ready 参数，当其值为 false 时，请求永远都不会发出。

当 ready 参数的值为 false 时，请求永远都不会发出。其主要是在 onBefore 阶段，返回了 stopNow。

```ts
onBefore: () => {
  if (!ready) {
    return {
      stopNow: true,
    };
  }
},
```

然后在 Fetch 类中，阻止请求发送：

```ts
// stop request
if (stopNow) {
  return new Promise(() => {});
}
```

这里引发了一个思考，那就是插件和 Fetch 类的隔离问题。可以看到，该插件的状态已经会影响到 Fetch 类了，在设计上我认为应该尽可能隔离，但功能上其实是有依赖的。这种暂时还没想到更优的处理方式。(或者直接在插件中修改实例上的 state？比如：`fetchInstance.state.data = cacheData.data;`)

然后就是 ready 发生变化的时候，进行监听处理：

```ts
// useUpdateEffect 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行。
useUpdateEffect(() => {
  // manual 值为 false
  if (!manual && ready) {
    hasAutoRun.current = true;
    fetchInstance.run(...defaultParams);
  }
  // ready 的变化执行
}, [ready]);
```

### 依赖更新

> useRequest 提供了一个 options.refreshDeps 参数，当它的值变化后，会重新触发请求。

其实现就是对 refreshDeps 进行监听。其中 refreshDepsAction 这个参数只有在内部会用到，外部 API 中暂时没有提及，感觉可以暴露。

```ts
useUpdateEffect(() => {
  if (hasAutoRun.current) {
    return;
  }
  if (!manual) {
    hasAutoRun.current = true;
    // 这个参数只有在内部会用到，外部 API 中暂时没有提及，感觉可以暴露
    // 依赖变化的时候的处理逻辑，假如有传的话，就执行该逻辑，否则请求请求
    if (refreshDepsAction) {
      refreshDepsAction();
    } else {
      // 采用上次的参数进行执行
      fetchInstance.refresh();
    }
  }
  // 依赖项发生变化的时候执行
}, [...refreshDeps]);
```
