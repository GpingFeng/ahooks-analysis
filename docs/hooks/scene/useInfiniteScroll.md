# useInfiniteScroll

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-infinite-scroll)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useInfiniteScroll/index.tsx)

## 简介

> useInfiniteScroll 封装了常见的无限滚动逻辑。

详细可看[官网](https://ahooks.gitee.io/zh-CN/hooks/use-infinite-scroll)

注意：这里的无限滚动指的是常见的点击加载更多或者说下拉加载更加功能，而不是虚拟滚动，虚拟滚动后面会讲到。

## 实现原理

实现原理：使用了 [useRequest](https://ahooks.gitee.io/zh-CN/hooks/use-request/index) hook 负责进行请求后台数据。其中 reloadAsync 对应 useRequest 的 runAsync，reload 对应 useRequest 的 run。前者返回 Promise，需要自行处理异常。后者内部已经做了异常处理。

另外假如传入 target 和 isNoMore 参数，通过监听 scroll 事件，判断是否滚动到指定的位置（支持设置 threshold 值-距离底部距离阈值），进行自动发起加载更多请求，从而实现滚动自动加载效果。

大概说完原理，来看代码。

## 具体实现

入参以及状态定义，可以直接看注释：

```ts
const useInfiniteScroll = <TData extends Data>(
  // 请求服务
  service: Service<TData>,
  options: InfiniteScrollOptions<TData> = {},
) => {
  const {
    // 父级容器，如果存在，则在滚动到底部时，自动触发 loadMore。需要配合 isNoMore 使用，以便知道什么时候到最后一页了。
    target,
    // 是否有最后一页的判断逻辑，入参为当前聚合后的 data
    isNoMore,
    // 下拉自动加载，距离底部距离阈值
    threshold = 100,
    // 变化后，会自动触发 reload
    reloadDeps = [],
    // 默认 false。 即在初始化时自动执行 service。
    // 如果设置为 true，则需要手动调用 reload 或 reloadAsync 触发执行。
    manual,
    // service 执行前触发
    onBefore,
    // 执行后
    onSuccess,
    // service reject 时触发
    onError,
    // service 执行完成时触发
    onFinally,
  } = options;

  // 最终的数据
  const [finalData, setFinalData] = useState<TData>();
  // 是否loading more
  const [loadingMore, setLoadingMore] = useState(false);
  // 省略代码...
};
```

判断是否有数据：isNoMore 的入参是当前聚合后的 data。

```ts
// 判断是否还有数据
const noMore = useMemo(() => {
  if (!isNoMore) return false;
  return isNoMore(finalData);
}, [finalData]);
```

通过 useRequest 处理请求，可以看到 onBefore、onSuccess、onError、onFinally、manual 等参数都是直接传到了 useRequest 中。

```ts
// 通过 useRequest 处理请求
const { loading, run, runAsync, cancel } = useRequest(
  // 入参，将上次请求返回的数据整合到新的参数中
  async (lastData?: TData) => {
    const currentData = await service(lastData);
    // 首次请求，则直接设置
    if (!lastData) {
      setFinalData(currentData);
    } else {
      setFinalData({
        ...currentData,
        // service 返回的数据必须包含 list 数组，类型为 { list: any[], ...rest }
        // @ts-ignore
        list: [...lastData.list, ...currentData.list],
      });
    }
    return currentData;
  },
  {
    // 是否手动控制
    manual,
    // 请求结束
    onFinally: (_, d, e) => {
      // 设置 loading 为 false
      setLoadingMore(false);
      onFinally?.(d, e);
    },
    // 请求前
    onBefore: () => onBefore?.(),
    // 请求成功之后
    onSuccess: d => {
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        scrollMethod();
      });
      onSuccess?.(d);
    },
    onError: e => onError?.(e),
  },
);
```

loadMore/loadMoreAsync 和 reload/reloadAsync 分别对应调用的是 useRequest 的 run 和 runAsync 函数。

```ts
// 同步加载更多
const loadMore = () => {
  // 假如没有更多，直接返回
  if (noMore) return;
  setLoadingMore(true);
  // 执行 useRequest
  run(finalData);
};

// 异步加载更多，返回的值是 Promise，需要自行处理异常
const loadMoreAsync = () => {
  if (noMore) return Promise.reject();
  setLoadingMore(true);
  return runAsync(finalData);
};

const reload = () => run();
const reloadAsync = () => runAsync();
```

并且当 reloadDeps 依赖发生变化的时候，会触发 reload，进行重置：

```ts
useUpdateEffect(() => {
  run();
}, [...reloadDeps]);
```

最后就是滚动自动加载的逻辑，通过 scrollHeight - scrollTop <= clientHeight + threshold 结果判断是否触底。

```ts
// 滚动方法
const scrollMethod = () => {
  const el = getTargetElement(target);
  if (!el) {
    return;
  }
  // Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。
  const scrollTop = getScrollTop(el);
  // Element.scrollHeight 这个只读属性是一个元素内容高度的度量，包括由于溢出导致的视图中不可见内容。
  const scrollHeight = getScrollHeight(el);
  // 这个属性是只读属性，对于没有定义CSS或者内联布局盒子的元素为0，否则，它是元素内部的高度(单位像素)，包含内边距，但不包括水平滚动条、边框和外边距。
  const clientHeight = getClientHeight(el);

  // 根据上面三个值以及 threshold 判断是否进行加载更多
  if (scrollHeight - scrollTop <= clientHeight + threshold) {
    loadMore();
  }
};

// 监听滚动事件
useEventListener(
  'scroll',
  () => {
    if (loading || loadingMore) {
      return;
    }
    scrollMethod();
  },
  { target },
);
```

上面提到的三个重要的值 scrollTop，scrollHeight，clientHeight 可以看 utils 中的 [rect](/hooks/utils/rect)。

对应的值分别为以下结果：

[scrollTop](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop)

> Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。一个元素的 scrollTop 值是这个元素的内容顶部（卷起来的）到它的视口可见内容（的顶部）的距离的度量。当一个元素的内容没有产生垂直方向的滚动条，那么它的 scrollTop 值为 0。

[scrollHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight)

> Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。一个元素的 scrollTop 值是这个元素的内容顶部（卷起来的）到它的视口可见内容（的顶部）的距离的度量。当一个元素的内容没有产生垂直方向的滚动条，那么它的 scrollTop 值为 0。

[clientHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/clientHeight)

> 这个属性是只读属性，对于没有定义 CSS 或者内联布局盒子的元素为 0，否则，它是元素内部的高度 (单位像素)，包含内边距，但不包括水平滚动条、边框和外边距。clientHeight 可以通过 CSS height + CSS padding - 水平滚动条高度 (如果存在) 来计算。
