# useFusionTable

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-fusion-table)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useFusionTable/index.tsx)

> 封装了常用的 Fusion Form 与 Fusion Table 联动逻辑。

笔者没用过 Fusion。用过的同学可以 PR 补充完整。

从源码上来看，其实现原理主要是基于 [useAntdTable](/hooks/scene/use-antd-table)，对入参的 form 以及结果做了一层适配，逻辑原理上应该差不多。

```ts
const useFusionTable = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: FusionTableOptions<TData, TParams> = {},
): FusionTableResult<TData, TParams> => {
  const ret = useAntdTable<TData, TParams>(service, {
    ...options,
    form: options.field ? fieldAdapter(options.field) : undefined,
  });

  return resultAdapter(ret);
};
```
