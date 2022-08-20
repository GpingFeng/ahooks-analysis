# useResponsive

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-responsive)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useResponsive/index.ts)

> 获取响应式信息。

主要实现原理是监听 resize 方法，判断与配置的每一种宽度，大于则为 true，否则为 false。

默认的响应式配置和 bootstrap 是一致的：

```ts
// 默认配置
let responsiveConfig: ResponsiveConfig = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};
```

可以通过 configResponsive 配置，因为 responsiveConfig 这个是一个全局变量，所以不需要重复配置。**假如重复配置，会重复执行 calculate 函数，可能会有性能问题。** calculate 函数后面会提到。

```ts
// 暴露的可以配置方法
export function configResponsive(config: ResponsiveConfig) {
  responsiveConfig = config;
  if (info) calculate();
}
```

接下来看主函数。首先执行 calculate 方法，然后是监听 resize 方法，触发 handleResize 回调方法。

```ts
export function useResponsive() {
  const windowExists = typeof window !== 'undefined';
  // listening 避免多次监听，性能考虑
  if (windowExists && !listening) {
    info = {};
    calculate();
    // 监听 resize 事件
    window.addEventListener('resize', handleResize);
    listening = true;
  }
  // 省略代码，后面会提到
}
```

calculate 主要负责计算当前的屏幕宽度与配置比较，得出最后的结果。留意这里通过判断是否有变更，并通过 shouldUpdate 来判断是否需要进行更新，这样对性能优化有帮助。

```ts
// 计算
function calculate() {
  const width = window.innerWidth;
  const newInfo = {} as ResponsiveInfo;
  let shouldUpdate = false;
  for (const key of Object.keys(responsiveConfig)) {
    // 如果宽度大于配置值，则为 true。
    newInfo[key] = width >= responsiveConfig[key];
    if (newInfo[key] !== info[key]) {
      shouldUpdate = true;
    }
  }
  // 假如有更新，则更新
  if (shouldUpdate) {
    info = newInfo;
  }
}
```

看 resize 事件回调，handleResize：这里最后会调用全局的所有订阅器。那是什么时候订阅的呢？

```ts
// resize 事件回调
function handleResize() {
  const oldInfo = info;
  // 计算
  calculate();
  // 假如没有更新，则直接返回
  if (oldInfo === info) return;
  for (const subscriber of subscribers) {
    subscriber();
  }
}
```

上面的主函数代码还有下半部分，在组件 mounted 之后，添加相关订阅器。结合上面，我们留意 listening，这个避免每个组件都监听 resize 事件，全局只需要拥有一个监听事件即可，从而优化我们的性能。

```ts
export function useResponsive() {
  // ... 省略代码，上面提到的部分
  const [state, setState] = useState<ResponsiveInfo>(info);

  useEffect(() => {
    // 不支持非 window
    if (!windowExists) return;

    const subscriber = () => {
      setState(info);
    };
    subscribers.add(subscriber);
    return () => {
      // 组件销毁取消订阅
      subscribers.delete(subscriber);
      // 当全局订阅器不再有订阅器，则移除 resize
      if (subscribers.size === 0) {
        // 移除 resize 方法
        window.removeEventListener('resize', handleResize);
        listening = false;
      }
    };
  }, []);

  return state;
}
```
