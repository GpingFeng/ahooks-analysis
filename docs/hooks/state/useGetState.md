# useGetState

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-get-state)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useGetState/index.ts)

> 给 React.useState 增加了一个 getter 方法，以获取当前最新值。

其实现如下：

- 其实就是通过 useRef 记录最新的 state 的值，并暴露一个 getState 方法获取到最新的。

```js
function useGetState<S>(initialState?: S) {
  const [state, setState] = useState(initialState);
  // useRef 返回一个可变的 ref 对象，其 .current 属性被初始化为传入的参数（initialValue）。返回的 ref 对象在组件的整个生命周期内持续存在。
  // 使用 useRef 处理 state
  const stateRef = useRef(state);
  stateRef.current = state;
  const getState = useCallback(() => stateRef.current, []);

  return [state, setState, getState];
}
```

这在某一些情况下，可以避免 React 的闭包陷阱。如官网例子：

```ts
const [count, setCount, getCount] = useGetState<number>(0);

useEffect(() => {
  const interval = setInterval(() => {
    console.log('interval count', getCount());
  }, 3000);

  return () => {
    clearInterval(interval);
  };
}, []);
```

假如这里不使用 getCount()，而是直接使用 count，是获取不到最新的值的。
