# useUpdateEffect 和 useUpdateLayoutEffect

> useUpdateEffect 和 useUpdateLayoutEffect 的用法跟 useEffect 和 useLayoutEffect 一样，只是会忽略首次执行，只在依赖更新时执行。

实现思路：初始化一个标识符，刚开始为 false。当首次执行完的时候，置为 true。只有标识符为 true 的时候，才执行回调函数。

```js
// 忽略首次执行
export const createUpdateEffect: (
  hook: effectHookType,
) => effectHookType = hook => (effect, deps) => {
  const isMounted = useRef(false);

  // for react-refresh
  hook(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  hook(() => {
    // 首次执行完时候，设置为 true，从而下次依赖更新的时候可以执行逻辑
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      return effect();
    }
  }, deps);
};
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
