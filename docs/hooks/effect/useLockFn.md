# useLockFn

本文来探索一下 ahooks 的 useLockFn。

## 场景

试想一下，有这么一个场景，有一个表单，你可能多次提交，就很可能导致结果不正确。

解决这类问题的方法有很多，比如添加 loading，在第一次点击之后就无法再次点击。另外一种方法就是给请求异步函数添加上一个静态锁，防止并发产生。这就是 ahooks 的 useLockFn 做的事情。

## useLockFn

`useLockFn` 用于给一个异步函数增加竞态锁，防止并发执行。

它的源码比较简单，如下所示：

```js
import { useRef, useCallback } from 'react';

// 用于给一个异步函数增加竞态锁，防止并发执行。
function useLockFn<P extends any[] = any[], V extends any = any>(fn: (...args: P) => Promise<V>) {
  // 是否现在处于一个锁中
  const lockRef = useRef(false);
  // 返回的是增加了竞态锁的函数
  return useCallback(
    async (...args: P) => {
      // 判断请求是否正在进行
      if (lockRef.current) return;
      // 请求中
      lockRef.current = true;
      try {
        // 执行原有请求
        const ret = await fn(...args);
        // 请求完成，状态锁设置为 false
        lockRef.current = false;
        return ret;
      } catch (e) {
        // 请求失败，状态锁设置为 false
        lockRef.current = false;
        throw e;
      }
    },
    [fn],
  );
}

export default useLockFn;
```

可以看到，它的入参是异步函数，返回的是一个增加了竞态锁的函数。通过 lockRef 做一个标识位，初始化的时候它的值为 false。当正在请求，则设置为 true，从而下次再调用这个函数的时候，就直接 return，不执行原函数，从而达到加锁的目的。

### 缺点

虽然实用，但缺点很明显，**我需要给每一个需要添加竞态锁的请求异步函数都手动加一遍**。那有没有比较通用和方便的方法呢？

答案是可以通过 axios 自动取消重复请求。

## axios 自动取消重复请求

### axios 取消请求

对于原生的 XMLHttpRequest 对象发起的 HTTP 请求，可以调用 XMLHttpRequest 对象的 abort 方法。

那么我们项目中常用的 axios 呢？它其实底层也是用的 XMLHttpRequest 对象，它对外暴露取消请求的 API 是 CancelToken。可以使用如下：

```js
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.post(
  '/user/12345',
  {
    name: 'gopal',
  },
  {
    cancelToken: source.token,
  },
);

source.cancel('Operation canceled by the user.'); // 取消请求，参数是可选的
```

另外一种使用的方法是调用 CancelToken 的构造函数来创建 CancelToken，具体使用如下：

```js
const CancelToken = axios.CancelToken;
let cancel;

axios.get('/user/12345', {
  cancelToken: new CancelToken(function executor(c) {
    cancel = c;
  }),
});

cancel(); // 取消请求
```

### 如何自动取消重复的请求

知道了如何取消请求，那怎么做到自动取消呢？答案是通过 axios 的拦截器。

- 请求拦截器：该类拦截器的作用是在请求发送前统一执行某些操作，比如在请求头中添加 token 相关的字段。
- 响应拦截器：该类拦截器的作用是在接收到服务器响应后统一执行某些操作，比如发现响应状态码为 401 时，自动跳转到登录页。

具体的做法如下：

第一步，定义几个重要的辅助函数。

- `generateReqKey`：用于根据当前请求的信息，生成请求 Key。**只有 key 相同才会判定为是重复请求**。这一点很重要，而且可能跟具体的业务场景有关，比如有一种请求，输入框模糊搜索，用户高频输入关键字，一次性发出多个请求，可能先发出的请求，最后才响应，导致实际搜索结果与预期不符。这种其实就只需要根据 URL 和请求方法判定其为重复请求，然后取消之前的请求就可以了。

这里我认为，如果有需要的话，可以暴露一个 API 给开发者进行自定义重复的规则。这里我们先根据请求方法、url、以及参数生成唯一的 key 去做。

```js
function generateReqKey(config) {
  const { method, url, params, data } = config;
  return [method, url, Qs.stringify(params), Qs.stringify(data)].join('&');
}
```

- addPendingRequest。用于把当前请求信息添加到 pendingRequest 对象中。

```js
const pendingRequest = new Map();
function addPendingRequest(config) {
  const requestKey = generateReqKey(config);
  config.cancelToken =
    config.cancelToken ||
    new axios.CancelToken(cancel => {
      if (!pendingRequest.has(requestKey)) {
        pendingRequest.set(requestKey, cancel);
      }
    });
}
```

- removePendingRequest。检查是否存在重复请求，**若存在则取消已发的请求**。

```js
function removePendingRequest(config) {
  const requestKey = generateReqKey(config);
  if (pendingRequest.has(requestKey)) {
    const cancelToken = pendingRequest.get(requestKey);
    cancelToken(requestKey);
    pendingRequest.delete(requestKey);
  }
}
```

第二步，添加请求拦截器。

```js
axios.interceptors.request.use(
  function(config) {
    removePendingRequest(config); // 检查是否存在重复请求，若存在则取消已发的请求
    addPendingRequest(config); // 把当前请求信息添加到pendingRequest对象中
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);
```

第二步，添加响应拦截器。

```js
axios.interceptors.response.use(
  response => {
    removePendingRequest(response.config); // 从pendingRequest对象中移除请求
    return response;
  },
  error => {
    removePendingRequest(error.config || {}); // 从pendingRequest对象中移除请求
    if (axios.isCancel(error)) {
      console.log('已取消的重复请求：' + error.message);
    } else {
      // 添加异常处理
    }
    return Promise.reject(error);
  },
);
```

到这一步，我们就通过 axios 完成了自动取消重复请求的功能。

## 思考与总结

虽然可以通过类似 useLockFn 这样的 hook 或方法给请求函数添加竞态锁的方式解决重复请求的问题。但这种还是需要依赖于开发者的习惯，如果没有一些规则的约束，很难避免问题。

通过 axios 拦截器以及其 CancelToken 功能，我们能够在拦截器中自动将已发的请求取消，当然假如有一些接口就是需要重复发送请求，可以考虑加一下白名单功能，让请求不进行取消。

## 参考

- [Axios 如何取消重复请求？](https://mp.weixin.qq.com/s?__biz=MzAxODE2MjM1MA==&mid=2651576212&idx=2&sn=b1c3fac9534f01f4d7c68f7b88800d5c&chksm=80250055b75289430570c54ba104675cbc6e5cf15cd35154a63f1d89b9f7211fb2f88f232e0f&scene=21#wechat_redirect)
