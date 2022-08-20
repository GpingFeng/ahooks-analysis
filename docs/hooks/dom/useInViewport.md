# useInViewport

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-in-viewport)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useInViewport/index.ts)

> 观察元素是否在可见区域，以及元素可见比例。

其实现原理就是 [Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)。并使用 [intersection-observer](https://www.npmjs.com/package/intersection-observer) 这个 npm 包进行 polyfill 处理。

> Intersection Observer API 提供了一种异步检测目标元素与祖先元素或 viewport 相交情况变化的方法。

其核心实现很简单，如下所示：

```ts
useEffectWithTarget(
  () => {
    const el = getTargetElement(target);
    if (!el) {
      return;
    }
    // Intersection Observer API 提供了一种异步检测目标元素与祖先元素或 viewport 相交情况变化的方法。
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          setRatio(entry.intersectionRatio);
          if (entry.isIntersecting) {
            setState(true);
          } else {
            setState(false);
          }
        }
      },
      {
        ...options,
        root: getTargetElement(options?.root),
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  },
  [],
  target,
);
```
