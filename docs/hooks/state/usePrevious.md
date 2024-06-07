# usePrevious

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-previous)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/usePrevious/index.ts)

> 保存上一次状态的 Hook。

其原理，是每次状态变更的时候，比较值有没有发生变化，变更状态：

- 维护两个状态 prevRef（保存上一次的状态）和 curRef（保存当前状态）。
- 状态变更的时候，使用 shouldUpdate 判断是否发生变化，默认通过 `Object.is` 判断。开发者可以自定义 shouldUpdate 函数，并决定什么时候记录上一次状态。
- 状态发生变化，更新 prevRef 的值为上一个 curRef，并更新 curRef 为当前的状态。

```ts
const defaultShouldUpdate = <T>(a?: T, b?: T) => !Object.is(a, b);
function usePrevious<T>(
  state: T,
  shouldUpdate: ShouldUpdateFunc<T> = defaultShouldUpdate,
): T | undefined {
  // 使用了 useRef 的特性，一直保持引用不变
  // 保存上一次值
  const prevRef = useRef<T>();
  // 当前值
  const curRef = useRef<T>();

  // 自定义是否更新上一次的值
  if (shouldUpdate(curRef.current, state)) {
    prevRef.current = curRef.current;
    curRef.current = state;
  }

  return prevRef.current;
}
```
