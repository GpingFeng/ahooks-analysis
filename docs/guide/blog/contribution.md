# 如何给开源项目提 PR

本篇文章算是该系列的一个彩蛋篇，记录一下第一次给开源项目提 PR 的过程（之前好像也有过，不过那个非常小的一个改动），希望能够帮助更多的人参与到开源项目中来。

## 起因

在写了几篇关于 ahooks 的文章之后，收到了官方同学的私信。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ded8f4ba1b1740c0841781146ac1a71f~tplv-k3u1fbpfcp-zoom-1.image)

这让我受宠若惊的同时也有点小兴奋和惶恐。

兴奋是，之前感觉参与开源是一件遥不可及的事情，现在似乎我也能够去做了。当然也有私心，假如我的简历上有给开源项目做贡献的经历，那岂不是一个不错的加分项？

惶恐的是，我之前没有参与过开源项目，担心自己不能做好这件事。

根据大佬的建议，我决定先从一些 issue 入手，也就是帮忙解决一下 issue。

## 明确问题 OR 需求

于是我抱着试试看的态度，看了一下官方的 issue，看到这么一条。[issue 详情](https://github.com/alibaba/hooks/issues/1645)。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a5670d79299845e58df958ee66b9c7fc~tplv-k3u1fbpfcp-zoom-1.image)

刚好我之前对 useRequest 源码做过一些分析——[如何使用插件化机制优雅的封装你的请求](https://juejin.cn/post/7105733829972721677)。于是我决定 fix 一下这个 issue。

这个 issue 的需求很简单，就是希望轮询失败后，能够支持最大的轮询次数，假如失败的次数大于这个值，则停止轮询。

## 编码前准备

首先，从 ahooks 官方 GitHub 中 folk 一份。这个操作我之前已经做了。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cd38b4d9e02c4d029c6dbeeb53ad9682~tplv-k3u1fbpfcp-zoom-1.image)

第二步，基于 master 切换一个功能分支。如下：

```bash
git checkout -b fix/pollingSupportRetryCount
```

最后就是环境的一些初始化操作，不同的仓库不同，ahooks 如下：

```bash
yarn run init
yarn start
```

## 功能实现

我们先来看下现在 useRequest 的轮询的实现，其原理主要是在一个请求结束的时候（不管成功与失败），通过 setTimeout 进行重新请求，达到轮询的效果。

```js
onFinally: () => {
  // 省略部分代码...
  // 通过 setTimeout 进行轮询
  timerRef.current = setTimeout(() => {
    fetchInstance.refresh();
  }, pollingInterval);
},
```

我的想法是，定义一个 options 参数，`pollingErrorRetryCount`，默认为 -1，代表没有限制。

另外定义一个变量，记录当前重试的次数：

```
const countRef = useRef<number>(0);
```

当开发者设置了 pollingErrorRetryCount，并且重试的数量大于该值，我们就直接返回，不执行轮询的逻辑。

当成功或者失败的时候，更新当前重试的次数：

```js
onError: () => {
  countRef.current += 1;
},
onSuccess: () => {
  countRef.current = 0;
},
```

然后在请求结束的时候，判断重试的次数有没有达到了开发设置的次数，假如没有则执行重试操作。有则重置重试的次数，停止轮询。

```js
onFinally: () => {
  if (
    pollingErrorRetryCount === -1 ||
    // When an error occurs, the request is not repeated after pollingErrorRetryCount retries
    (pollingErrorRetryCount !== -1 && countRef.current <= pollingErrorRetryCount)
  ) {
    // 忽略部分代码
    timerRef.current = setTimeout(() => {
      fetchInstance.refresh();
    }, pollingInterval);
  } else {
    countRef.current = 0;
  }
},
```

## 测试用例

上述整体的改造并不困难，但是我在写测试用例的时候，就开始踩坑了，因为我很少书写前端的测试用例，还是针对于 hooks 的测试用例。这里是我耗时最多的地方。

最终用例如下：

```js
// 省略部分代码...
// if request error and set pollingErrorRetryCount
// and the number of consecutive failures exceeds pollingErrorRetryCount, polling stops
let hook2;
let errorCallback;
act(() => {
  errorCallback = jest.fn();
  hook2 = setUp(() => request(0), {
    pollingErrorRetryCount: 3,
    pollingInterval: 100,
    pollingWhenHidden: true,
    onError: errorCallback,
  });
});

expect(hook2.result.current.loading).toEqual(true);
expect(errorCallback).toHaveBeenCalledTimes(0);

act(() => {
  jest.runAllTimers();
});
await hook2.waitForNextUpdate();
expect(hook2.result.current.loading).toEqual(false);
expect(errorCallback).toHaveBeenCalledTimes(1);

act(() => {
  jest.runAllTimers();
});
await hook2.waitForNextUpdate();
expect(errorCallback).toHaveBeenCalledTimes(2);

act(() => {
  jest.runAllTimers();
});
await hook2.waitForNextUpdate();
expect(errorCallback).toHaveBeenCalledTimes(3);

act(() => {
  jest.runAllTimers();
});
await hook2.waitForNextUpdate();
expect(errorCallback).toHaveBeenCalledTimes(4);

act(() => {
  jest.runAllTimers();
});
expect(errorCallback).toHaveBeenCalledTimes(4);

act(() => {
  hook2.result.current.run();
});
act(() => {
  jest.runAllTimers();
});
await hook2.waitForNextUpdate();
expect(errorCallback).toHaveBeenCalledTimes(5);

hook2.unmount();
// 省略部分代码...
```

大致解释下该测试用例的逻辑，我设置了重试三次，错误之后，运行了三次，`errorCallback` 就会被调用了 4 次（包括错误那次）。在第五次执行的时候，就不会执行 `errorCallback`，也就还是 4 次。然后我们手动 run 一次请求，期待 `errorCallback` 应该执行 5 次。

这里踩了一个坑，就是第五次请求的时候，我之前是会写一个等待定时器执行的操作，但实际上这里它是不会执行定时器的，导致一直报错，在这里折腾了很久。后来删除了下面的代码才执行成功。

```diff
act(() => {
  jest.runAllTimers();
});
- await hook2.waitForNextUpdate();
expect(errorCallback).toHaveBeenCalledTimes(4);
```

## 文档以及 Demo 补充

毕竟加了一个新的 API 参数，需要在文档中注明，而且中英文文档都需要补充，还加上了一个 Demo 示例。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e54d059aa2214252bce45a33509992fb~tplv-k3u1fbpfcp-zoom-1.image)

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/007c31e08a45455f8ca7b38d7c218c1d~tplv-k3u1fbpfcp-zoom-1.image)

## 提 PR

上述都完成之后，就可以提交你的代码了，提交完，去到在你 folk 过来的项目中，可以看到这个。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aa5bfbd00273492a91f0a1ca2c14d9cd~tplv-k3u1fbpfcp-zoom-1.image)

我们需要点击图中框起来的「Compare & pull request 」，之后就会出现如下图

![图来自网络，演示用](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49470a751cc74a6daf01f78f4860379b~tplv-k3u1fbpfcp-zoom-1.image)

默认会帮我们选好分支的，我们只需要完善其中的信息，还有我们之前提交的 message 也可以修改。最好可以用英文来解释，本次提交的内容。

最后点击提交之后就好了。

还有一个提 PR 的入口，如下所示：

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7c64fdc4b4f24fac87c66e859d7e7c01~tplv-k3u1fbpfcp-zoom-1.image)

最后等待官方 CR 就可以了（上面的实现其实部分是 CR 后改的）。目前该 PR 已经被合入到 master。

## 总结思考

给开源项目提 PR **操作过程**不是一件很复杂的事情，重点在于需求的修改。往往需要考虑到多种边界场景，这个时候，我们就需要前端的单元测试来帮助我们覆盖全面的场景。

另外，对于一些还没有参与开源项目经验的同学来讲，我觉得类似 ahooks 这种工具库是一个不错的选择：

- 它的模块划分更加清晰，你改了一个模块的功能，影响面可以更好的预估。对新人比较友好。
- 逻辑相对简单，其实你会发现很多代码说不定在你们的业务项目中的 utils/hooks 文件夹中就有。
- 社区比较活跃，维护者能够较快的响应。

希望对大家有所帮助。
