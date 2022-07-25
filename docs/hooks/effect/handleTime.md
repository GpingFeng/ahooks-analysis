# 控制“时机”的 hook

本文来探索一下 ahooks 是怎么封装 React 的一些执行“时机”的？

## Function Component VS Class Component

学习类似 React 和 Vue 这种框架，对它们生命周期的掌握都是必须的，我们需要清楚的知道我们代码的执行顺序，并且在不同的阶段执行不同操作的代码，比如需要挂载完成之后才去获取 dom 的值，否则可能会获取不到相应的值。

### Class Component

使用过 React 的 Class Component 的同学，就会知道其组件生命周期会分成三个状态：

- Mounting(挂载)：已插入真实 DOM
- Updating(更新)：正在被重新渲染
- Unmounting(卸载)：已移出真实 DOM

简单版如下所示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d6d3f9861ebd459ba6f84f481399c726~tplv-k3u1fbpfcp-zoom-1.image)

其中每个状态中还会按顺序调用不同的方法，对应的详细如下（这里不展开说）：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f8acad51fa674b4b9f19d0b774756fc3~tplv-k3u1fbpfcp-zoom-1.image)

可以通过官方提供这个网站查看[详情](https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/)

可以看到，会有非常多的生命周期方法，而且在不同的版本，生命周期方法还不同。

### Function Component

到了 Function Component ，会发现没有直接提及生命周期的概念，它是更彻底的状态驱动，它只有一个状态，React 负责将状态渲染到视图中。

对于 Function Component 来说由状态到页面渲染只有三步：

- 输入状态（prop、state）
- 执行组件的逻辑，**并在 `useEffect/useLayoutEffect` 中订阅副作用**
- 输出 UI（Dom 节点）

重点是第二步，React 通过 useEffect/useLayoutEffect 订阅副作用。Class Component 中的生命周期都可以通过 useEffect/useLayoutEffect 来实现。它们两个的功能非常相似，我们这里看下 useEffect。

使用 useEffect 相当于告诉 React 组件需要在渲染后执行某些操作，React 将在执行 DOM 更新之后调用它。React 保证了每次运行 useEffect 的时候，DOM 已经更新完毕。这就实现了 Class Component 中的 Mounting(挂载阶段)。

当状态发生变化的时候，它能够执行对应的逻辑、更行状态并将结果渲染到视图中，这就完成了 Class Component 中的 Updating（更新阶段）。

最后通过在 useEffect 中返回一个函数，它便可以清理副作用。它的规则是：

- 首次渲染不会进行清理，会在下一次渲染，清除上一次的副作用。
- 卸载阶段也会执行清除操作。

通过返回一个函数，我们就能实现 Class Component 中的 Unmounting(卸载阶段)。

**基于 useEffect/useLayoutEffect，ahooks 做了一些封装，能够让你更加清晰的知道你的代码执行时机。**

## LifeCycle - 生命周期

### useMount

只在组件初始化时执行的 Hook。
useEffect 依赖假如为空，只会在组件初始化的时候执行。

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

### useUnmount

useUnmount，组件卸载（unmount）时执行的 Hook。

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

### useUnmountedRef

获取当前组件是否已经卸载的 Hook。

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

## Effect

> 这里只会讲官方文档 `Effect` 下面的几个，有部分是定时器、防抖节流等，咱们后面的系列具体分析。

### useUpdateEffect 和 useUpdateLayoutEffect

useUpdateEffect 和 useUpdateLayoutEffect 的用法跟 useEffect 和 useLayoutEffect 一样，只是会忽略首次执行，只在依赖更新时执行。

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

### useDeepCompareEffect 和 useDeepCompareLayoutEffect

用法与 useEffect 一致，但 deps 通过 lodash isEqual 进行深比较。

通过 useRef 保存上一次的依赖的值，跟当前的依赖对比（使用 lodash 的 isEqual），并将对比结果作为 useEffect 的依赖项，从而决定回调函数是否执行。

```js
const depsEqual = (aDeps: DependencyList, bDeps: DependencyList = []) => {
  return isEqual(aDeps, bDeps);
};

const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
  // 通过 useRef 保存上一次的依赖的值
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  // 判断最新的依赖和旧的区别
  // 如果相等，则变更 signalRef.current，从而触发 useEffect 中的回调
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  useEffect(effect, [signalRef.current]);
};
```

### useUpdate

useUpdate 会返回一个函数，调用该函数会强制组件重新渲染。

返回的函数通过变更 useState 返回的 state，从而促使组件进行更新。

```js
import { useCallback, useState } from 'react';

const useUpdate = () => {
  const [, setState] = useState({});
  // 通过设置一个全新的状态，促使 function 组件更新
  return useCallback(() => setState({}), []);
};

export default useUpdate;
```

## 总结与思考

在我们写代码的时候需要清晰的知道，组件的生命周期是怎样的，我们代码的执行顺序、执行的时机是怎样的。

在 Function Component 中，使用 useEffect/useLayoutEffect 完成了 Class Components 生命周期的职责。ahooks 也是基于这两个封装了常见的代码执行时机，使用这些 hook，可以让我们的代码更加具有可读性以及逻辑更加清晰。

系列文章：

- [大家都能看得懂的源码（一）ahooks 整体架构篇](https://juejin.cn/post/7105396478268407815)
- [如何使用插件化机制优雅的封装你的请求 hook ](https://juejin.cn/post/7105733829972721677)
- [ahooks 是怎么解决 React 的闭包问题的？](https://juejin.cn/post/7106061970184339464)
- [ahooks 是怎么解决用户多次提交问题？](https://juejin.cn/post/7106461530232717326)
