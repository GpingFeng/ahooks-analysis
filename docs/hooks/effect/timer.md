# useInterval 和 useTimeout

文档地址

- [useInterval](https://ahooks.js.org/zh-CN/hooks/use-interval)
- [useTimeout](https://ahooks.js.org/zh-CN/hooks/use-timeout)

详细代码

- [useInterval](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useInterval/index.ts)
- [useTimeout](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useTimeout/index.ts)

看名称，我们就能大概知道，它们的功能对应的是 setInterval 和 setTimeout，那对比后者有什么优势？

先看 `useInterval`，代码简单，如下所示：

```js
function useInterval(
  fn: () => void,
  delay: number | undefined,
  options?: {
    immediate?: boolean,
  },
) {
  const immediate = options?.immediate;
  const fnRef = useLatest(fn);

  useEffect(() => {
    // 忽略部分代码...
    // 立即执行
    if (immediate) {
      fnRef.current();
    }
    const timer = setInterval(() => {
      fnRef.current();
    }, delay);
    // 清除定时器
    return () => {
      clearInterval(timer);
    };
    // 动态修改 delay 以实现定时器间隔变化与暂停。
  }, [delay]);
}
```

跟 setInterval 的区别如下：

- 可以支持第三个参数，通过 immediate 能够立即执行我们的定时器。
- 在变更 delay 的时候，会自动清除旧的定时器，并同时启动新的定时器。
- 通过 useEffect 的返回清除机制，**开发者不需要关注清除定时器的逻辑，避免内存泄露问题**。这点是很多开发者会忽略的点。

useTimeout 跟上面很类似，如下所示，不再做额外解释：

```js
function useTimeout(fn: () => void, delay: number | undefined): void {
  const fnRef = useLatest(fn);

  useEffect(() => {
    // ...忽略部分代码
    const timer = setTimeout(() => {
      fnRef.current();
    }, delay);
    return () => {
      clearTimeout(timer);
    };
    // 动态修改 delay 以实现定时器间隔变化与暂停。
  }, [delay]);
}
```
