# useUnmount

> useUnmount，组件卸载（unmount）时执行的 Hook。

useEffect 可以在组件渲染后实现各种不同的副作用。有些副作用可能需要清除，所以需要返回一个函数，这个函数会在组件卸载的时候执行。

```js
const useUnmount = (fn: () => void) => {
  const fnRef = useLatest(fn);

  useEffect(
    // 在组件卸载（unmount）时执行的 Hook。
    // useEffect 的返回值中执行函数
    () => () => {
      fnRef.current();
    },
    [],
  );
};

export default useUnmount;
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
