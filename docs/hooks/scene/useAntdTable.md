# useAntdTable

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-antd-table)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useAntdTable/index.tsx)

> useAntdTable 基于 useRequest 实现，封装了常用的 Ant Design Form 与 Ant Design Table 联动逻辑，并且同时支持 antd v3 和 v4。

首先调用 usePagination 处理分页的逻辑。

```ts
const useAntdTable = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: AntdTableOptions<TData, TParams> = {},
) => {
  const {
    // form 实例
    form,
    // 默认表单选项
    defaultType = 'simple',
    // 默认参数，第一项为分页数据，第二项为表单数据。[pagination, formData]
    defaultParams,
    manual = false,
    // refreshDeps 变化，会重置 current 到第一页，并重新发起请求。
    refreshDeps = [],
    ready = true,
    ...rest
  } = options;

  // 对分页的逻辑进行处理
  // 分页也是对 useRequest 的再封装
  const result = usePagination<TData, TParams>(service, {
    manual: true,
    ...rest,
  });
  // ...
};
```

然后处理列表页筛选 Form 表单的逻辑，这里支持 Antd v3 和 Antd v4 版本。

```ts
// 判断是否为 Antd 的第四版本
const isAntdV4 = !!form?.getInternalHooks;
```

获取当前表单值，`form.getFieldsValue` 或者 `form.getFieldInstance`：

```ts
// 获取当前的 from 值
const getActivetFieldValues = () => {
  if (!form) {
    return {};
  }
  // antd 4
  if (isAntdV4) {
    return form.getFieldsValue(null, () => true);
  }
  // antd 3
  const allFieldsValue = form.getFieldsValue();
  const activeFieldsValue = {};
  Object.keys(allFieldsValue).forEach((key: string) => {
    if (form.getFieldInstance ? form.getFieldInstance(key) : true) {
      activeFieldsValue[key] = allFieldsValue[key];
    }
  });
  return activeFieldsValue;
};
```

校验表单逻辑 `form.validateFields`:

```ts
// 校验逻辑
const validateFields = (): Promise<Record<string, any>> => {
  if (!form) {
    return Promise.resolve({});
  }
  const activeFieldsValue = getActivetFieldValues();
  const fields = Object.keys(activeFieldsValue);
  // antd 4
  // validateFields 直接调用
  if (isAntdV4) {
    return (form.validateFields as Antd4ValidateFields)(fields);
  }
  // antd 3
  return new Promise((resolve, reject) => {
    form.validateFields(fields, (errors, values) => {
      if (errors) {
        reject(errors);
      } else {
        resolve(values);
      }
    });
  });
};
```

重置表单 `form.setFieldsValue`：

```ts
// 重置表单
const restoreForm = () => {
  if (!form) {
    return;
  }
  // antd v4
  if (isAntdV4) {
    return form.setFieldsValue(allFormDataRef.current);
  }
  // antd v3
  const activeFieldsValue = {};
  Object.keys(allFormDataRef.current).forEach(key => {
    if (form.getFieldInstance ? form.getFieldInstance(key) : true) {
      activeFieldsValue[key] = allFormDataRef.current[key];
    }
  });
  form.setFieldsValue(activeFieldsValue);
};
```

修改表单类型，支持 `'simple'` 和 `'advance'`。初始化的表单数据可以填写 simple 和 advance 全量的表单数据，开发者可以根据当前激活的类型来设置表单数据。修改 type 的时候会重置 form 表单数据。

```ts
const changeType = () => {
  // 获取当前表单值
  const activeFieldsValue = getActivetFieldValues();
  // 修改表单值
  allFormDataRef.current = {
    ...allFormDataRef.current,
    ...activeFieldsValue,
  };
  // 设置表单类型
  setType(t => (t === 'simple' ? 'advance' : 'simple'));
};

// 修改 type，则重置 form 表单数据
useUpdateEffect(() => {
  if (!ready) {
    return;
  }
  restoreForm();
}, [type]);
```

`_submit` 方法：对 form 表单校验后，根据当前 form 表单数据、分页等筛选条件进行对表格数据搜索。

```ts
const _submit = (initPagination?: TParams[0]) => {
  setTimeout(() => {
    // 先进行校验
    validateFields()
      .then((values = {}) => {
        // 分页的逻辑
        const pagination = initPagination || {
          pageSize: options.defaultPageSize || 10,
          ...(params?.[0] || {}),
          current: 1,
        };
        // 假如没有 form，则直接根据分页的逻辑进行请求
        if (!form) {
          // @ts-ignore
          run(pagination);
          return;
        }
        // 获取到当前所有 form 的 Data 参数
        // record all form data
        allFormDataRef.current = {
          ...allFormDataRef.current,
          ...values,
        };

        // @ts-ignore
        run(pagination, values, {
          allFormData: allFormDataRef.current,
          type,
        });
      })
      .catch(err => err);
  });
};
```

另外当表格触发 onChange 方法的时候，也会进行请求：

```ts
// Table 组件的 onChange 事件
const onTableChange = (pagination: any, filters: any, sorter: any) => {
  const [oldPaginationParams, ...restParams] = params || [];
  run(
    // @ts-ignore
    {
      ...oldPaginationParams,
      current: pagination.current,
      pageSize: pagination.pageSize,
      filters,
      sorter,
    },
    ...restParams,
  );
};
```

初始化的时候，会根据当前是否有缓存的数据，有则根据缓存的数据执行请求逻辑。否则，通过 `manual` 和 `ready` 判断是否需要进行重置表单后执行请求逻辑。

```ts
// 初始化逻辑
// init
useEffect(() => {
  // if has cache, use cached params. ignore manual and ready.
  // params.length > 0，则说明有缓存
  if (params.length > 0) {
    // 使用缓存的数据
    allFormDataRef.current = cacheFormTableData?.allFormData || {};
    // 重置表单后执行请求
    restoreForm();
    // @ts-ignore
    run(...params);
    return;
  }
  // 非手动并且已经 ready，则执行 _submit
  if (!manual && ready) {
    allFormDataRef.current = defaultParams?.[1] || {};
    restoreForm();
    _submit(defaultParams?.[0]);
  }
}, []);
```

最后，将请求返回的数据通过 dataSource、 pagination、loading 透传回给到 Table 组件，实现 Table 的数据以及状态的展示。以及将对 Form 表单的一些操作方法暴露给开发者。

```ts
return {
  ...result,
  // Table 组件需要的数据，直接透传给 Table 组件即可
  tableProps: {
    dataSource: result.data?.list || defaultDataSourceRef.current,
    loading: result.loading,
    onChange: useMemoizedFn(onTableChange),
    pagination: {
      current: result.pagination.current,
      pageSize: result.pagination.pageSize,
      total: result.pagination.total,
    },
  },
  search: {
    // 提交表单
    submit: useMemoizedFn(submit),
    // 当前表单类型， simple | advance
    type,
    // 切换表单类型
    changeType: useMemoizedFn(changeType),
    // 重置当前表单
    reset: useMemoizedFn(reset),
  },
} as AntdTableResult<TData, TParams>;
```
