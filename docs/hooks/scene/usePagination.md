# usePagination

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-pagination)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/usePagination/index.ts)

> usePagination 基于 useRequest 实现，封装了常见的分页逻辑。

首先通过 useRequest 处理请求，service 约定返回的数据结构为 `{ total: number, list: Item[] }`。

其中 useRequest 的 defaultParams 参数第一个参数为 `{ current: number, pageSize: number }`。并根据请求的参数以及返回的 total 值，得出总的页数。

还有 refreshDeps 变化，会重置 current 到第一页「`changeCurrent(1)`」，并重新发起请求，一般你可以把 pagination 依赖的条件放这里。

```ts
const usePagination = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: PaginationOptions<TData, TParams> = {},
) => {
  const { defaultPageSize = 10, ...rest } = options;

  // service 返回的数据结构为 { total: number, list: Item[] }
  const result = useRequest(service, {
    // service 的第一个参数为 { current: number, pageSize: number }
    defaultParams: [{ current: 1, pageSize: defaultPageSize }],
    // refreshDeps 变化，会重置 current 到第一页，并重新发起请求，一般你可以把 pagination 依赖的条件放这里
    refreshDepsAction: () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      changeCurrent(1);
    },
    ...rest,
  });
  // 取到相关的请求参数
  const { current = 1, pageSize = defaultPageSize } = result.params[0] || {};
  // 获取请求结果，total 代表数据总条数
  const total = result.data?.total || 0;
  // 获取到总的页数
  const totalPage = useMemo(() => Math.ceil(total / pageSize), [
    pageSize,
    total,
  ]);
};
```

重点看下 onChange 方法：

- 入参分别为当前页数以及当前每一页的最大数量。
- 根据 total 算出总页数。
- 获取到所有的参数，执行请求逻辑。
- 当修改当前页或者当前每一页的最大数量的时候，直接调用 onChange 方法。

```ts
// c，代表 current page
// p，代表 page size
const onChange = (c: number, p: number) => {
  let toCurrent = c <= 0 ? 1 : c;
  const toPageSize = p <= 0 ? 1 : p;
  // 根据 total 算出总页数
  const tempTotalPage = Math.ceil(total / toPageSize);
  // 假如此时总页面小于当前页面，需要将当前页面赋值为总页数
  if (toCurrent > tempTotalPage) {
    toCurrent = Math.max(1, tempTotalPage);
  }

  const [oldPaginationParams = {}, ...restParams] = result.params || [];

  // 重新执行请求
  result.run(
    // 留意参数变化，主要是当前页数和每页的总数量发生变化
    {
      ...oldPaginationParams,
      current: toCurrent,
      pageSize: toPageSize,
    },
    ...restParams,
  );
};

const changeCurrent = (c: number) => {
  onChange(c, pageSize);
};

const changePageSize = (p: number) => {
  onChange(current, p);
};
```

最后返回请求的结果以及 pagination 字段，包含所有分页信息。另外还有操作分页的函数。

```ts
return {
  ...result,
  // 会额外返回 pagination 字段，包含所有分页信息，及操作分页的函数。
  pagination: {
    current,
    pageSize,
    total,
    totalPage,
    onChange: useMemoizedFn(onChange),
    changeCurrent: useMemoizedFn(changeCurrent),
    changePageSize: useMemoizedFn(changePageSize),
  },
} as PaginationResult<TData, TParams>;
```

小结：usePagination 默认用法与 useRequest 一致，但内部封装了分页请求相关的逻辑。返回的结果多返回一个 pagination 参数，包含所有分页信息，及操作分页的函数。

缺点就是对 API 请求参数有所限制，比如入参结构必须为 `{ current: number, pageSize: number }`，返回结果为 `{ total: number, list: Item[] }`。
