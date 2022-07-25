# useTitle

> 用于设置页面标题。

这个页面标题指的是浏览器 Tab 中展示的。通过 document.title 设置。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0fcad6992aa3459497c4d1dbd16e64a4~tplv-k3u1fbpfcp-zoom-1.image)

代码非常简单，一看就会：

```ts
function useTitle(title: string, options: Options = DEFAULT_OPTIONS) {
  const titleRef = useRef(isBrowser ? document.title : '');
  useEffect(() => {
    document.title = title;
  }, [title]);

  useUnmount(() => {
    // 组件卸载后，恢复上一次的 title
    if (options.restoreOnUnmount) {
      document.title = titleRef.current;
    }
  });
}
```
