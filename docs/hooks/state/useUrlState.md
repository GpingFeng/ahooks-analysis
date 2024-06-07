# useUrlState

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-url-state)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useUrlState/index.ts)

本文来讲下 ahooks 中的 useUrlState。

> 通过 url query 来管理 state 的 Hook。

## useUrlState 的特殊

在之前的架构篇中我们就提到，ahooks 这个项目是一个 `monoRepo`。它的项目管理是通过 [lerna](https://www.lernajs.cn/ 'lerna') 进行管理的。可以从官网以及源码中看到 useUrlState 是独立一个仓库进行管理的。

也就是你必须单独安装：

```
npm i @ahooksjs/use-url-state -S
```

我认为官方这么做的理由是 useUrlState 基于 react-router 的 useLocation & useHistory & useNavigate 进行 query 管理。所以你必须要安装 react-router 的 5.x 或者 6.x 版本。**但其实很多 React 项目都不一定使用 react-router。假如将这个 hook 内置到 ahooks 中的话，可能会导致包体积变大。**

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a64d9122503d4794a6ae5356b1945ce2~tplv-k3u1fbpfcp-zoom-1.image)

另外，该 hook 是依赖于 query-string 这个 npm 包的。使用这个包，我认为理由有以下几点：

- 一来是其功能强大，支持很多的 options 选项，满足我们各类业务需求。
- 二来它业内也比较成熟，避免重复造轮子。
- 三来它的包体积也很小，没什么负担。我们主要用到它的 parse 和 stringify 方法，压缩后只有 2.4 k。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3ea7b8a864e0496c920b1c20e9353e18~tplv-k3u1fbpfcp-zoom-1.image)

通过示例简单介绍下，这两个方法：

qs.parse(string, [options])

```js
qs.parse('?name=jim'); // {name: 'jim'}
qs.parse('#token=123'); // {token: '123'}
qs.parse('name=jim&name=lily&age=22'); // {name: ['jim', 'lily'], age: 22}
qs.parse('foo[]=1&foo[]=2&foo[]=3', { arrayFormat: 'bracket' });
//=> {foo: ['1', '2', '3']}
```

qs.stringify(object, [options])

```js
qs.stringify({ name: 'jim', age: 22 }); // 'age=22&name=jim'
qs.stringify({ name: ['jim', 'lily'], age: 22 }); // 'age=22&name=jim&name=lily'
qs.stringify({ foo: [1, 2, 3] }, { arrayFormat: 'bracket' });
//=> 'foo[]=1&foo[]=2&foo[]=3'
```

## useUrlState 源码解析

直接看代码，显示初始值部分。

- 第一个参数为初始状态，第二个参数为 url 的配置，包括状态变更时切换 history 的方式、query-string parse 和 stringify 的配置。
- 通过 react-router 的 useLocation 获取到 URL 的 location 对象。
- react-router 兼容 5.x 和 6.x，**其中 5.x 使用 useHistory，6.x 使用 useNavigate**。
- queryFromUrl 是调用 query-string 的 parse 方法，将 location 对象的 search 处理成对象值。
- targetQuery 就是处理之后的最终值-将 queryFromUrl 和初始值进行 merge 之后的结果。

```ts
// ...
import * as tmp from 'react-router';
// ...
const useUrlState = <S extends UrlState = UrlState>(
  // 初始状态
  initialState?: S | (() => S),
  // url 配置
  options?: Options,
) => {
  type State = Partial<{ [key in keyof S]: any }>;
  const {
    // 状态变更时切换 history 的方式
    navigateMode = 'push',
    // query-string parse 的配置
    parseOptions,
    // query-string stringify 的配置
    stringifyOptions,
  } = options || {};

  const mergedParseOptions = { ...baseParseConfig, ...parseOptions };
  const mergedStringifyOptions = {
    ...baseStringifyConfig,
    ...stringifyOptions,
  };

  // useLocation钩子返回表示当前URL的location对象。您可以将它想象成一个useState，它在URL更改时返回一个新值。
  const location = rc.useLocation();

  // https://v5.reactrouter.com/web/api/Hooks/usehistory
  // useHistory 钩子可以访问用来导航的历史实例。
  // react-router v5
  const history = rc.useHistory?.();
  // react-router v6
  const navigate = rc.useNavigate?.();

  const update = useUpdate();

  const initialStateRef = useRef(
    typeof initialState === 'function'
      ? (initialState as () => S)()
      : initialState || {},
  );

  // 根据 url query
  const queryFromUrl = useMemo(() => {
    return parse(location.search, mergedParseOptions);
  }, [location.search]);

  const targetQuery: State = useMemo(
    () => ({
      ...initialStateRef.current,
      ...queryFromUrl,
    }),
    [queryFromUrl],
  );
  // 省略部分代码
};
```

接下来看 url 的状态设置：

- 首先是根据传入的 s 值，获取到新的状态 newQuery，支持 function 方式。
- 根据不同的 react-router 的版本调用不同的方法进行更新。
  - 假如是 5.x 版本，调用 useHistory 方法，更新对应的状态。
  - 假如是 6.x 版本，调用 useNavigate 方法，更新对应的状态。
- 通过 update() - `useUpdate()` 更新状态。

```ts
// 设置 url 状态
const setState = (s: React.SetStateAction<State>) => {
  const newQuery = typeof s === 'function' ? s(targetQuery) : s;
  // 1. 如果 setState 后，search 没变化，就需要 update 来触发一次更新。比如 demo1 直接点击 clear，就需要 update 来触发更新。
  // 2. update 和 history 的更新会合并，不会造成多次更新
  update();
  if (history) {
    history[navigateMode]({
      hash: location.hash,
      search:
        stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) ||
        '?',
    });
  }
  if (navigate) {
    navigate(
      {
        hash: location.hash,
        search:
          stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) ||
          '?',
      },
      {
        replace: navigateMode === 'replace',
      },
    );
  }
};
```

## 思考与总结

工具库中假如某个工具函数/hook 依赖于一个开发者可能并不会使用的包，而且这个包的体积还比较大的时候，可以将这个工具函数/hook 独立成一个 npm 包，开发者使用的时候才进行安装。另外这种可以考虑使用 monoRepo 的包管理方法，方便进行文档管理以及一些公共包管理等。
