# 整体架构

本系列主要是针对 ahooks 的 `v3.3.13` 版本进行源码解读。个人 folk 仓库可见 [详情](https://github.com/GpingFeng/hooks)。

## React hooks utils 库

自从 React 16.8 版本推出 React hooks，越来越多的项目使用 Function Component。React hooks utils 库随即诞生，它主要解决的两个问题如下：

- 公共逻辑的抽象。
- 解决 React hooks 存在的弊端，比如闭包等。

那现在社区有哪些比较优秀的 React Hooks utils 库呢？

[react-use](https://github.com/streamich/react-use) 是社区比较活跃的 React hooks utils 库，它的 star 数达到了 `29.6k`。它的功能非常强大，拥有的 hooks 已经 100+。假如你需要功能比较齐全，可以考虑选择 react-use。

如果不需要非常齐全的功能，只需要一些常见的功能，react-use 可能会稍微冗余了，可以考虑我们今天的主角——[ahooks](https://ahooks.js.org/zh-CN/guide)，目前它的 star 数为 `9.2k`，也算是社区比较活跃。

## ahooks

### 简介

官方介绍如下：

> ahooks，发音 [eɪ hʊks]，是一套高质量可靠的 React Hooks 库。在当前 React 项目研发过程中，一套好用的 React Hooks 库是必不可少的，希望 ahooks 能成为您的选择。

### 特点

它具有如下特点：

- 易学易用。
- 支持 SSR。
  - 将访问 DOM/BOM 的方法放在 useEffect 中（服务端不会执行），避免服务端执行时报错。
  - 源码中可以看到很多 `isBrowser` 的判断，主要是区分开浏览器环境和服务器环境。
- 对输入输出函数做了特殊处理，且避免闭包问题。
  - 输入的函数，永远都是使用最新的一份。这个是通过 `useRef` 进行实现。
  - 输出函数，地址都是不会变化的，这个是通过 `useMemoizedFn`（ahooks 封装的）实现的，其实现也是通过 `useRef` 实现。后面我们会提到。
- 包含大量提炼自业务的高级 Hooks。
- 包含丰富的基础 Hooks。
- 使用 TypeScript 构建，提供完整的类型定义文件。可以学习一些 TypeScript 的技巧。

### hooks 种类

ahooks 基于 UI、SideEffect、LifeCycle、State、DOM 等分类提供了常用的 Hooks。如下所示：

![图来自网络，侵删](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fdc00319d8dd4ed4b7b5cd32934d3f53~tplv-k3u1fbpfcp-zoom-1.image)

## ahooks 整体架构

### 项目启动

我们先从 ahooks 中 folk [一份](https://github.com/GpingFeng/hooks)，clone 下来。

```
yarn run init
yarn start
```

如果你能成功跑起服务，就会看到和官方文档一模一样的页面。

### 整体结构

从仓库的根目录的 package.json 中可以得到以下信息。

- 文档是使用 `dumi`。是一款为组件开发场景而生的文档工具。
- 该项目是一个 `monoRepo`。它的项目管理是通过 [lerna](https://www.lernajs.cn/) 进行管理的。
- 单元测试是通过 jest 实现。

它的目录结构中，可以看到 docs 中存放仓库公共文档。packages 中存放两个包，hooks 和 use-url-state。整体的结构跟 dumi 中给出的 lerna 项目的结构相似。其中每个包下面的每个组件都可以书写对应的文档，不一样的是，hooks 中每个组件多了 `__tests__` 文件夹，这个是用来写单元测试的。

![跟 hooks 相似的组织形式](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4e11526ec5614c5f97133d5855e61c9d~tplv-k3u1fbpfcp-zoom-1.image)

可以用以下一张图，大致总结一下 ahooks 的工程架构：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/26816b75f6d848df8fc49edceabb262e~tplv-k3u1fbpfcp-zoom-1.image)

### hooks

刚刚也提到，ahooks 是采用了 `monoRepo` 的方式，我们的源码都是在 packages 中，我们来看下 hooks。先看 `packages/hooks/package.json`。另外要使用 useUrlState 这个 hook，需要独立安装 `@ahooksjs/use-url-state`，其源码在 `packages/use-url-state` 中。我理解官方的用意应该是这个库依赖于 react-router，可能有一些项目不需要用到，把它提出来有助于减少包的大小。

```bash
npm i @ahooksjs/use-url-state -S
```

回到 `packages/hooks`。重点关注一下 dependencies 和 peerDependencies。可以看到其实它内部还是使用了一些其他的工具库的，比如 lodash（估计是避免重复造轮子，但感觉这样会导致包会变大）。后面我们也会对这些工具库做一个探索。

```js
"dependencies": {
  "@types/js-cookie": "^2.x.x",
  "ahooks-v3-count": "^1.0.0",
  "dayjs": "^1.9.1",
  "intersection-observer": "^0.12.0",
  "js-cookie": "^2.x.x",
  "lodash": "^4.17.21",
  "resize-observer-polyfill": "^1.5.1",
  "screenfull": "^5.0.0"
},
"peerDependencies": {
  "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
},
```

另外解释下 peerDependencies。

> `peerDependencies` 的目的是提示宿主环境去安装满足插件 `peerDependencies` 所指定依赖的包，然后在插件 `import` 或者 `require` 所依赖的包的时候，永远都是引用宿主环境统一安装的 `npm` 包，最终解决插件与所依赖包不一致的问题。这里的宿主环境一般指的就是我们自己的项目本身了。

这对于封装 npm 包非常重要。当你写的包 a 里面依赖另一个包 b，而这个包 b 是引用这个包 a 的业务的常用的包的时候，建议写在 `peerDependencies` 里，避免重复下载/多个版本共存。

## 总结

作为系列的第一篇，介绍了 React hooks utils 库的背景以及 ahooks 的特点简介和整体结构，接下来会探索各个常见的 hooks 方法实现，敬请期待。

## 参考

- [ahooks 正式发布：值得拥抱的 React Hooks 工具库](https://developer.aliyun.com/article/768059)
