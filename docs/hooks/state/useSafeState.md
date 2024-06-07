# useSafeState

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-safe-state)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useSafeState/index.ts)

> 用法与 React.useState 完全一样，但是在组件卸载后异步回调内的 setState 不再执行，避免因组件卸载后更新状态而导致的内存泄漏。

代码如下：

- 在更新的时候，通过 useUnmountedRef 判断如果组件卸载，则停止更新。

```ts
function useSafeState<S>(initialState?: S | (() => S)) {
  // 判断是否卸载
  const unmountedRef = useUnmountedRef();
  const [state, setState] = useState(initialState);
  const setCurrentState = useCallback(currentState => {
    // 如果组件卸载，则停止更新
    if (unmountedRef.current) return;
    setState(currentState);
  }, []);

  return [state, setCurrentState] as const;
}
```

useUnmountedRef 这个我们之前提过，简单回顾下，其实就是在 hook 的返回值中标记组件为已卸载。

```ts
const useUnmountedRef = () => {
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    // 如果已经卸载，则会执行 return 中的逻辑
    return () => {
      unmountedRef.current = true;
    };
  }, []);
  return unmountedRef;
};
```
