# useUnmountedRef

> 获取当前组件是否已经卸载的 Hook。

通过判断有没有执行 useEffect 中的返回值判断当前组件是否已经卸载。

```js
// 获取当前组件是否已经卸载的 Hook。
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

export default useUnmountedRef;
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
