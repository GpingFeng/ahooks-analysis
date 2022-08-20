# useMount

> 只在组件初始化时执行的 Hook。

主要实现原理：useEffect 依赖假如为空，只会在组件初始化的时候执行。

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-mount)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useMount/index.ts)

```js
// 省略部分代码
const useMount = (fn: () => void) => {
  // 省略部分代码
  // 单纯就在 useEffect 基础上封装了一层
  useEffect(() => {
    fn?.();
  }, []);
};

export default useMount;
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
