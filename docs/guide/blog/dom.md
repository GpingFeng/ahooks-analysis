# DOM 规范

本篇文章探讨一下 ahooks 对 DOM 类 Hooks 使用规范，以及源码中是如何去做处理的。

## DOM 类 Hooks 使用规范

这一章节，大部分参考官方文档的 [DOM 类 Hooks 使用规范](https://ahooks.js.org/zh-CN/guide/dom)。

第一点，ahooks 大部分 DOM 类 Hooks 都会接收 target 参数，表示要处理的元素。

target 支持三种类型 React.MutableRefObject（通过 useRef 保存的 DOM）、HTMLElement、() => HTMLElement（一般运用于 SSR 场景）。

第二点，DOM 类 Hooks 的 target 是支持动态变化的。如下所示：

```js
export default () => {
  const [boolean, { toggle }] = useBoolean();

  const ref = useRef(null);
  const ref2 = useRef(null);

  const isHovering = useHover(boolean ? ref : ref2);
  return (
    <>
      <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>
      <div ref={ref2}>{isHovering ? 'hover' : 'leaveHover'}</div>
    </>
  );
};
```

那 ahooks 是怎么处理这两点的呢？

## getTargetElement

获取到对应的 DOM 元素，这一点主要兼容以上第一点的入参规范。

- 假如是函数，则取执行完后的结果。
- 假如拥有 current 属性，则取 current 属性的值，兼容 `React.MutableRefObject` 类型。
- 最后就是普通的 DOM 元素。

```ts
export function getTargetElement<T extends TargetType>(
  target: BasicTarget<T>,
  defaultElement?: T,
) {
  // 省略部分代码...
  let targetElement: TargetValue<T>;

  if (isFunction(target)) {
    // 支持函数获取
    targetElement = target();
    // 假如 ref，则返回 current
  } else if ('current' in target) {
    targetElement = target.current;
    // 支持 DOM
  } else {
    targetElement = target;
  }

  return targetElement;
}
```

## useEffectWithTarget

这个方法，主要是为了支持第二点，支持 target 动态变化。

其中 `packages/hooks/src/utils/useEffectWithTarget.ts` 是使用 useEffect。

```ts
import { useEffect } from 'react';
import createEffectWithTarget from './createEffectWithTarget';

const useEffectWithTarget = createEffectWithTarget(useEffect);

export default useEffectWithTarget;
```

另外 其中 `packages/hooks/src/utils/useLayoutEffectWithTarget.ts` 是使用 useLayoutEffect。

```ts
import { useLayoutEffect } from 'react';
import createEffectWithTarget from './createEffectWithTarget';

const useEffectWithTarget = createEffectWithTarget(useLayoutEffect);

export default useEffectWithTarget;
```

两者都是调用的 createEffectWithTarget，只是入参不同。

直接重点看这个 createEffectWithTarget 函数：

- createEffectWithTarget 返回的函数 **useEffectWithTarget** 接受三个参数，前两个跟 useEffect 一样，第三个就是 target。
- useEffectType 就是 useEffect 或者 useLayoutEffect。注意这里调用的时候，**没传第二个参数，也就是每次都会执行**。
- hasInitRef 判断是否已经初始化。lastElementRef 记录的是最后一次 target 元素的列表。lastDepsRef 记录的是最后一次的依赖。unLoadRef 是执行完 effect 函数（对应的就是 useEffect 中的 effect 函数）的返回值，在组件卸载的时候执行。
- 第一次执行的时候，执行相应的逻辑，并记录下最后一次执行的相应的 target 元素以及依赖。
- 后面每次执行的时候，都判断目标元素或者依赖是否发生变化，发生变化，则执行对应的 effect 函数。并更新最后一次执行的依赖。
- 组件卸载的时候，执行 unLoadRef.current?.() 函数，并重置 hasInitRef 为 false。

```ts
const createEffectWithTarget = (
  useEffectType: typeof useEffect | typeof useLayoutEffect,
) => {
  /**
   * @param effect
   * @param deps
   * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
   */
  const useEffectWithTarget = (
    effect: EffectCallback,
    deps: DependencyList,
    target: BasicTarget<any> | BasicTarget<any>[],
  ) => {
    const hasInitRef = useRef(false);

    const lastElementRef = useRef<(Element | null)[]>([]);
    const lastDepsRef = useRef<DependencyList>([]);

    const unLoadRef = useRef<any>();

    // useEffect 或者 useLayoutEffect
    useEffectType(() => {
      // 处理 DOM 目标元素
      const targets = Array.isArray(target) ? target : [target];
      const els = targets.map(item => getTargetElement(item));

      // init run
      // 首次初始化的时候执行
      if (!hasInitRef.current) {
        hasInitRef.current = true;
        lastElementRef.current = els;
        lastDepsRef.current = deps;
        // 执行回调中的 effect 函数
        unLoadRef.current = effect();
        return;
      }
      // 非首次执行的逻辑
      if (
        // 目标元素或者依赖发生变化
        els.length !== lastElementRef.current.length ||
        !depsAreSame(els, lastElementRef.current) ||
        !depsAreSame(deps, lastDepsRef.current)
      ) {
        // 执行上次返回的结果
        unLoadRef.current?.();

        // 更新
        lastElementRef.current = els;
        lastDepsRef.current = deps;
        unLoadRef.current = effect();
      }
    });

    useUnmount(() => {
      // 卸载
      unLoadRef.current?.();
      // for react-refresh
      hasInitRef.current = false;
    });
  };

  return useEffectWithTarget;
};
```

## 思考与总结

一个优秀的工具库应该有自己的一套输入输出规范，一来能够支持更多的场景，二来可以更好的在内部进行封装处理，三来使用者能够更加快速熟悉和使用相应的功能，能做到举一反三。
