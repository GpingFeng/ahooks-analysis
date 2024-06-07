# useCreation

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-creation)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useCreation/index.ts)

> useCreation 是 useMemo 或 useRef 的替代品。
> 因为 useMemo 不能保证被 memo 的值一定不会被重计算，而 useCreation 可以保证这一点。
> 而相比于 useRef，你可以使用 useCreation 创建一些常量，这些常量和 useRef 创建出来的 ref 有很多使用场景上的相似，但对于复杂常量的创建，useRef 却容易出现潜在的性能隐患。

```ts
const a = useRef(new Subject()); // 每次重渲染，都会执行实例化 Subject 的过程，即便这个实例立刻就被扔掉了
const b = useCreation(() => new Subject(), []); // 通过 factory 函数，可以避免性能隐患
```

实现原理是基于 useRef 再加一层判断，可以直接看注释：

```ts
export default function useCreation<T>(factory: () => T, deps: DependencyList) {
  const { current } = useRef({
    deps,
    obj: undefined as undefined | T,
    initialized: false,
  });
  // 刚初始化或者依赖不相等的时候（通过 Object.is 进行判断）
  if (current.initialized === false || !depsAreSame(current.deps, deps)) {
    // 更新依赖
    current.deps = deps;
    // 执行工厂函数
    current.obj = factory();
    // 初始化标识位置为 true
    current.initialized = true;
  }
  return current.obj as T;
}
```
