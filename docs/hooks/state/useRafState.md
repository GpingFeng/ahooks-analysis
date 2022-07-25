# useRafState

> 只在 requestAnimationFrame callback 时更新 state，一般用于性能优化。

`window.requestAnimationFrame()` 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行。

假如你的操作是比较频繁的，就可以通过这个 hook 进行性能优化。

- 重点看 setRafState 方法，它执行的时候，**会取消上一次的 setRafState 操作。重新通过 requestAnimationFrame 去控制 setState 的执行时机**。
- 另外**在页面卸载的时候，会直接取消操作，避免内存泄露**。

```ts
function useRafState<S>(initialState?: S | (() => S)) {
  const ref = useRef(0);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback((value: S | ((prevState: S) => S)) => {
    cancelAnimationFrame(ref.current);
    ref.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  // unMount 的时候，去除监听
  useUnmount(() => {
    cancelAnimationFrame(ref.current);
  });

  return [state, setRafState] as const;
}
```
