# 核心原理-plugin 机制

本文来讲下 ahooks 的核心 hook —— useRequest。在介绍它的详细功能之前，我们得先介绍它的核心原理，plugin 机制。

## useRequest 简介

> useRequest 是一个强大的异步数据管理的 Hooks，React 项目中的网络请求场景使用 useRequest 就够了。

useRequest **通过插件式组织代码**，核心代码极其简单，并且可以很方便的扩展出更高级的功能。目前已有能力包括：

- 自动请求/手动请求。
- 轮询。
- 防抖。
- 节流。
- 屏幕聚焦重新请求。
- 错误重试。
- loading delay。
- SWR(stale-while-revalidate)。
- 缓存。

这里可以看到 useRequest 的功能是非常强大的，如果让你来实现，你会如何实现？也可以从介绍中看到官方的答案——插件化机制。

本文涉及到的详细代码，大家可以结合一起阅读（留意还有 utils 和 plugin 文件夹）：

- [useRequest](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/useRequest.ts) 和 [useRequestImplement](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/useRequestImplement.ts)
- [Fetch 类](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRequest/src/Fetch.ts)

## 架构

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a1b7e12f8f3440a0b168421268865e63~tplv-k3u1fbpfcp-zoom-1.image)

如上图所示，我把整个 useRequest 分成了几个模块。

- 入口 useRequest。它负责的是初始化处理数据以及将结果返回。
- Fetch。是整个 useRequest 的核心代码，它处理了整个请求的生命周期。
- plugin。在 Fetch 中，会通过插件化机制在不同的时机触发不同的插件方法，拓展 useRequest 的功能特性。
- utils 和 types.ts。提供工具方法以及类型定义。

## useRequest 入口处理

先从入口文件开始，`packages/hooks/src/useRequest/src/useRequest.ts`。

```js
function useRequest<TData, TParams extends any[]>(
  service: Service<TData, TParams>,
  options?: Options<TData, TParams>,
  plugins?: Plugin<TData, TParams>[],
) {
  return useRequestImplement<TData, TParams>(service, options, [
    // 插件列表，用来拓展功能，一般用户不使用。文档中没有看到暴露 API
    ...(plugins || []),
    useDebouncePlugin,
    useLoadingDelayPlugin,
    usePollingPlugin,
    useRefreshOnWindowFocusPlugin,
    useThrottlePlugin,
    useAutoRunPlugin,
    useCachePlugin,
    useRetryPlugin,
  ] as Plugin<TData, TParams>[]);
}

export default useRequest;
```

这里第一个参数（service 请求实例）第二个参数（配置选项），我们比较熟悉，第三个参数文档中没有提及，其实就是插件列表，用户可以自定义插件拓展功能，目前官方文档没有写明，估计是不希望我们这么用。

可以看到返回了 `useRequestImplement` 方法。主要是对 Fetch 类进行实例化。

```js
const update = useUpdate();
// 保证请求实例都不会发生改变
const fetchInstance = useCreation(() => {
  // 目前只有 useAutoRunPlugin 这个 plugin 有这个方法
  // 初始化状态，initState 值为 { loading: xxx }，代表是否 loading
  const initState = plugins.map((p) => p?.onInit?.(fetchOptions)).filter(Boolean);
  // 返回请求实例
  return new Fetch<TData, TParams>(
    serviceRef,
    fetchOptions,
    // 更新组件
    update,
    Object.assign({}, ...initState),
  );
}, []);
fetchInstance.options = fetchOptions;
// run all plugins hooks
// 执行所有的 plugin。每个 plugin 中都返回的方法，可以在特定时机执行。
fetchInstance.pluginImpls = plugins.map((p) => p(fetchInstance, fetchOptions));
```

实例化的时候，传参依次为请求实例，options 选项，组件的更新方法，初始状态值。

这里需要非常留意的一点是最后一行，它执行了所有的 plugins 插件，传入的是 fetchInstance 实例以及 options 选项，返回的结果赋值给 fetchInstance 实例的 `pluginImpls` 属性。

另外这个文件做的就是将结果返回给开发者了，这点不细说。

## Fetch 和 Plugins

接下来最核心的源码部分 —— Fetch 类。其代码不多，算是非常精简，先简化一下：

```js
export default class Fetch<TData, TParams extends any[]> {
  // 插件执行后返回的方法列表
  pluginImpls: PluginReturn<TData, TParams>[];
  count: number = 0;
  // 几个重要的返回值
  state: FetchState<TData, TParams> = {
    loading: false,
    params: undefined,
    data: undefined,
    error: undefined,
  };

  constructor(
    // React.MutableRefObject —— useRef创建的类型，可以修改
    public serviceRef: MutableRefObject<Service<TData, TParams>>,
    public options: Options<TData, TParams>,
    // 订阅-更新函数
    public subscribe: Subscribe,
    // 初始值
    public initState: Partial<FetchState<TData, TParams>> = {},
  ) {
    this.state = {
      ...this.state,
      loading: !options.manual, // 非手动，就loading
      ...initState,
    };
  }

  // 更新状态
  setState(s: Partial<FetchState<TData, TParams>> = {}) {
    this.state = {
      ...this.state,
      ...s,
    };
    this.subscribe();
  }

  // 执行插件中的某个事件（event），rest 作为参数传入
  runPluginHandler(event: keyof PluginReturn<TData, TParams>, ...rest: any[]) {
    // 省略代码...
  }

  // 如果设置了 options.manual = true，则 useRequest 不会默认执行，需要通过 run 或者 runAsync 来触发执行。
  // runAsync 是一个返回 Promise 的异步函数，如果使用 runAsync 来调用，则意味着你需要自己捕获异常。
  async runAsync(...params: TParams): Promise<TData> {
    // 省略代码...
  }
  // run 是一个普通的同步函数，其内部也是调用了 runAsync 方法
  run(...params: TParams) {
    // 省略代码...
  }

  // 取消当前正在进行的请求
  cancel() {
    // 省略代码...
  }

  // 使用上一次的 params，重新调用 run
  refresh() {
    // 省略代码...
  }

  // 使用上一次的 params，重新调用 runAsync
  refreshAsync() {
    // 省略代码...
  }

  // 修改 data。参数可以为函数，也可以是一个值
  mutate(data?: TData | ((oldData?: TData) => TData | undefined)) {
    // 省略代码...
}
```

### state 以及 setState

在 constructor 中，主要是进行了数据的初始化。其中维护的数据主要包含一下几个重要的数据以及通过 setState 方法设置数据，设置完成通过 subscribe 调用通知 useRequestImplement 组件重新渲染，从而获取最新值。（所以这里状态更新的时候，都会导致组件重新渲染。）

```js
// 几个重要的返回值
state: FetchState<TData, TParams> = {
  loading: false,
  params: undefined,
  data: undefined,
  error: undefined,
};
// 更新状态
setState(s: Partial<FetchState<TData, TParams>> = {}) {
  this.state = {
    ...this.state,
    ...s,
  };
  this.subscribe();
}
```

### 插件化机制的实现

上文有提到所有的插件运行的结果都赋值给 pluginImpls。它的类型定义如下：

```js
export interface PluginReturn<TData, TParams extends any[]> {
  onBefore?: (params: TParams) =>
    | ({
        stopNow?: boolean;
        returnNow?: boolean;
      } & Partial<FetchState<TData, TParams>>)
    | void;

  onRequest?: (
    service: Service<TData, TParams>,
    params: TParams,
  ) => {
    servicePromise?: Promise<TData>;
  };

  onSuccess?: (data: TData, params: TParams) => void;
  onError?: (e: Error, params: TParams) => void;
  onFinally?: (params: TParams, data?: TData, e?: Error) => void;
  onCancel?: () => void;
  onMutate?: (data: TData) => void;
}
```

除了最后一个 onMutate 之外，可以看到返回的方法都是在一个请求的生命周期中的。一个请求从开始到结束，如下图所示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/efb903d9f0de4cc3b45fec829135fc51~tplv-k3u1fbpfcp-zoom-1.image)

如果你比较仔细，你会发现**基本所有的插件功能都是在一个请求的一个或者多个阶段中实现的，也就是说我们只需要在请求的相应阶段，执行我们的插件的逻辑，就能执行和完成我们插件的功能**。

执行特定阶段插件方法的函数为 runPluginHandler，其 event 入参就是上面 PluginReturn key 值。

```js
// 执行插件中的某个事件（event），rest 为参数传入
runPluginHandler(event: keyof PluginReturn<TData, TParams>, ...rest: any[]) {
  // @ts-ignore
  const r = this.pluginImpls.map((i) => i[event]?.(...rest)).filter(Boolean);
  return Object.assign({}, ...r);
}
```

通过这样的方式，Fetch 类的代码会变得非常的精简，只需要完成整体流程的功能，所有额外的功能（比如重试、轮询等等）都交给插件去实现。这么做的优点：

- **符合职责单一原则**。一个 Plugin 只做一件事，相互之间不相关。整体的可维护性更高，并且拥有更好的可测试性。
- 符合深模块的软件设计理念。这个设计理念认为最好的模块既提供了强大的功能，又有着简单的接口。试想每个模块由一个长方形表示，如下图，长方形的面积大小和模块实现的功能多少成比例。顶部边代表模块的接口，边的长度代表它的复杂度。**最好的模块是深的：他们有很多功能隐藏在简单的接口后。深模块是好的抽象，因为它只把自己内部的一小部分复杂度暴露给了用户。**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/11aa0226420a4deabf75faed1623b2b9~tplv-k3u1fbpfcp-zoom-1.image)

### 核心方法 —— runAsync

可以看到 runAsync 是运行请求的最核心方法，其他的方法比如 `run/refresh/refreshAsync` 最终都是调用该方法。

并且该方法中就可以看到整体请求的生命周期的处理。这跟上面插件返回的方法设计是保持一致的。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8fa533b87e7045d1899a10cf14c6ba5d~tplv-k3u1fbpfcp-zoom-1.image)

#### 请求前 —— onBefore

处理请求前的状态，并执行 Plugins 返回的 onBefore 方法，并根据返回值执行相应的逻辑。比如，[useCachePlugin](./use-cache-plugin) 如果还存于新鲜时间内，则不用请求，返回 returnNow，这样就会直接返回缓存的数据。

```js
this.count += 1;
// 主要为了 cancel 请求
const currentCount = this.count;

const {
  stopNow = false,
  returnNow = false,
  ...state
  // 先执行每个插件的前置函数
} = this.runPluginHandler('onBefore', params);

// stop request
if (stopNow) {
  return new Promise(() => {});
}
this.setState({
  // 开始 loading
  loading: true,
  // 请求参数
  params,
  ...state,
});

// return now
// 立即返回，跟缓存策略有关
if (returnNow) {
  return Promise.resolve(state.data);
}

// onBefore - 请求之前触发
// 假如有缓存数据，则直接返回
this.options.onBefore?.(params);
```

#### 进行请求——onRequest

这个阶段只有 [useCachePlugin](./use-cache-plugin) 执行了 onRequest 方法，执行后返回 service Promise（有可能是缓存的结果），从而达到缓存 Promise 的效果。

```js
// replace service
// 如果有 cache 的实例，则使用缓存的实例
let { servicePromise } = this.runPluginHandler(
  'onRequest',
  this.serviceRef.current,
  params,
);

if (!servicePromise) {
  servicePromise = this.serviceRef.current(...params);
}

const res = await servicePromise;
```

[useCachePlugin](./use-cache-plugin) 返回的 onRequest 方法：

```js
// 请求阶段
onRequest: (service, args) => {
  // 看 promise 有没有缓存
  let servicePromise = cachePromise.getCachePromise(cacheKey);

  // If has servicePromise, and is not trigger by self, then use it
  // 如果有servicePromise，并且不是自己触发的，那么就使用它
  if (servicePromise && servicePromise !== currentPromiseRef.current) {
    return { servicePromise };
  }

  servicePromise = service(...args);
  currentPromiseRef.current = servicePromise;
  // 设置 promise 缓存
  cachePromise.setCachePromise(cacheKey, servicePromise);
  return { servicePromise };
},
```

#### 取消请求 —— onCancel

刚刚在请求开始前定义了 currentCount 变量，其实为了 cancel 请求。

```js
this.count += 1;
// 主要为了 cancel 请求
const currentCount = this.count;
```

在请求过程中，开发者可以调用 Fetch 的 cancel 方法：

```js
// 取消当前正在进行的请求
cancel() {
  // 设置 + 1，在执行 runAsync 的时候，就会发现 currentCount !== this.count，从而达到取消请求的目的
  this.count += 1;
  this.setState({
    loading: false,
  });

  // 执行 plugin 中所有的 onCancel 方法
  this.runPluginHandler('onCancel');
}
```

这个时候，currentCount !== this.count，就会返回空数据。

```js
// 假如不是同一个请求，则返回空的 promise
if (currentCount !== this.count) {
  // prevent run.then when request is canceled
  return new Promise(() => {});
}
```

#### 最后结果处理——onSuccess/onError/onFinally

这部分也就比较简单了，通过 try...catch...。最后成功，就直接在 try 末尾加上 onSuccess 的逻辑，失败在 catch 末尾加上 onError 的逻辑，两者都加上 onFinally 的逻辑。

```js
try {
  const res = await servicePromise;
  // 省略代码...
  this.options.onSuccess?.(res, params);
  // plugin 中 onSuccess 事件
  this.runPluginHandler('onSuccess', res, params);
  // service 执行完成时触发
  this.options.onFinally?.(params, res, undefined);
  if (currentCount === this.count) {
    // plugin 中 onFinally 事件
    this.runPluginHandler('onFinally', params, res, undefined);
  }
  return res;
  // 捕获报错
} catch (error) {
  // 省略代码...
  // service reject 时触发
  this.options.onError?.(error, params);
  // 执行 plugin 中的 onError 事件
  this.runPluginHandler('onError', error, params);
  // service 执行完成时触发
  this.options.onFinally?.(params, undefined, error);
  if (currentCount === this.count) {
    // plugin 中 onFinally 事件
    this.runPluginHandler('onFinally', params, undefined, error);
  }
  // 抛出错误。
  // 让外部捕获感知错误
  throw error;
}
```

## 思考与总结

useRequest 是 ahooks 最核心的功能之一，它的功能非常丰富，但核心代码（Fetch 类）相对简单，这得益于它的插件化机制，把特定功能交给特定的插件去实现，自己只负责主流程的设计，并暴露相应的执行时机即可。

这对于我们平时的组件/hook 封装很有帮助，**我们对一个复杂功能的抽象，可以尽可能保证对外接口简单。内部实现需要遵循单一职责的原则，通过类似插件化的机制，细化拆分组件，从而提升组件可维护性、可测试性。**

其中也提到了几个插件，我们后面针对几个重要的插件做下解析。

## 参考

- [ 软件设计之 Deep Module（深模块）](https://www.cnblogs.com/hhelibeb/p/10708951.html)
- [精读 ahooks useRequest 源码](https://juejin.cn/post/7042489413292523534#heading-4)
