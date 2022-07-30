# 缓存

阅读本章节之前，建议先阅读 useRequest 的[核心原理章节解析](/hooks/request/use-request)。

> useRequest 会将当前请求成功的数据缓存起来。下次组件初始化时，如果有缓存数据，我们会优先返回缓存数据，然后在背后发送新请求，也就是 SWR 的能力。

## useCachePlugin

缓存主要是由 useCachePlugin 这个 plugin 完成。

### 参数分析

先大概看下几个入参以及其代表含义：

```
  {
    // 请求唯一标识。如果设置了 cacheKey，我们会启用缓存机制。同一个 cacheKey 的数据全局同步。
    cacheKey,
    // 设置数据缓存时间，超过该时间，我们会清空该条缓存数据。
    cacheTime = 5 * 60 * 1000,
    // 设置数据保持新鲜时间，在该时间内，我们认为数据是新鲜的，不会重新发起请求。
    staleTime = 0,
    // 通过配置 setCache 和 getCache，可以自定义数据缓存，比如可以将数据存储到 localStorage、IndexDB 等。
    setCache: customSetCache,
    getCache: customGetCache,
  },
```

### 内部设置和获取缓存函数

内部定义了 \_setCache 和 \_getCache 用于设置和获取缓存。不管是设置还是获取，自定义对缓存数据的处理优先级都更高。

```ts
// cacheData 缓存数据
const _setCache = (key: string, cachedData: CachedData) => {
  // 假如有传入自定义的设置缓存，则优先使用自定义缓存
  if (customSetCache) {
    customSetCache(cachedData);
  } else {
    // 调用 cache utils 中的 setCache 函数
    cache.setCache(key, cacheTime, cachedData);
  }
  // 触发 key 的所有事件。假如 key 相同，就可以共享缓存的数据。
  cacheSubscribe.trigger(key, cachedData.data);
};

// 获取缓存值
const _getCache = (key: string, params: any[] = []) => {
  if (customGetCache) {
    return customGetCache(params);
  }
  return cache.getCache(key);
};
```

其中调用到了 cache.setCache 和 cache.getCache。接下来看这个 cache 的实现。

### cache

其逻辑在 `packages/hooks/src/useRequest/src/utils/cache.ts` 中。

- 通过 Map 数据结构进行缓存。

```ts
// 通过 map 数据结构进行缓存
const cache = new Map<CachedKey, RecordData>();
```

- 设置缓存。通过 Map 设置缓存数据。利用定时器实现超过 cacheTime 时间，清空（delete）该条缓存数据。

```ts
// 设置缓存
const setCache = (
  key: CachedKey,
  cacheTime: number,
  cachedData: CachedData,
) => {
  // 是否存在
  const currentCache = cache.get(key);
  // 假如存在，则先清除
  if (currentCache?.timer) {
    clearTimeout(currentCache.timer);
  }

  let timer: Timer | undefined = undefined;

  // 缓存时间，设置定时器
  if (cacheTime > -1) {
    // if cache out, clear it
    timer = setTimeout(() => {
      cache.delete(key);
    }, cacheTime);
  }

  // 设置缓存以及数据
  cache.set(key, {
    ...cachedData,
    timer,
  });
};
```

- 获取缓存。

```ts
const getCache = (key: CachedKey) => {
  return cache.get(key);
};
```

- 清空缓存。

```ts
const clearCache = (key?: string | string[]) => {
  if (key) {
    const cacheKeys = Array.isArray(key) ? key : [key];
    cacheKeys.forEach(cacheKey => cache.delete(cacheKey));
  } else {
    cache.clear();
  }
};
```

### 初始化逻辑

- 判断有没有全局缓存数据，有的话，先直接使用缓存中 data 和 params 进行替代，先将结果返回。并根据 staleTime 以及 cacheData.time 判断是否还处于新鲜时间内，假如是，则处理 loading 状态为 false。

```ts
const cacheData = _getCache(cacheKey);
if (cacheData && Object.hasOwnProperty.call(cacheData, 'data')) {
  // 直接使用缓存中 data 和 params 进行替代，先将结果返回。
  fetchInstance.state.data = cacheData.data;
  fetchInstance.state.params = cacheData.params;
  // staleTime为-1，或者还存在于新鲜时间内，则设置 loading 为 false
  if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
    fetchInstance.state.loading = false;
  }
}
```

- 根据 cacheKey 订阅缓存。

```ts
// 订阅同一个 cacheKey 的更新。假如两个都是用的同一个 cacheKey，那么它们的内容是可以全局同享的。
// subscribe same cachekey update, trigger update
unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, data => {
  fetchInstance.setState({ data });
});
```

那 cacheSubscribe 到底做了什么呢？接下来看下。

### cacheSubscribe

其代码在 `packages/hooks/src/useRequest/src/utils/cacheSubscribe.ts` 中，如下：

```ts
type Listener = (data: any) => void;
// 事件对象
const listeners: Record<string, Listener[]> = {};

// 触发某个属性(cacheKey)的所有事件
const trigger = (key: string, data: any) => {
  if (listeners[key]) {
    listeners[key].forEach(item => item(data));
  }
};

// 订阅事件，每个属性(cacheKey)维护一个事件列表
const subscribe = (key: string, listener: Listener) => {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  // push
  listeners[key].push(listener);

  // 返回清除订阅方法
  return function unsubscribe() {
    const index = listeners[key].indexOf(listener);
    listeners[key].splice(index, 1);
  };
};

export { trigger, subscribe };
```

这里使用的是发布-订阅设计模式，其维护了一个对象，属性为 cacheKey，值为该 cacheKey 对应的回调函数事件列表。

- subscribe 方法进行订阅。
- trigger 方法触发某个属性(cacheKey)的所有事件列表。

通过这种方式，在上面 \_setCache 设置缓存的方法调用的时候，能够及时通知到其他的实例及时更新 state。从而做到全局缓存状态共享，只需要 cacheKey 是一样即可。

### onBefore

在 onBefore 阶段

- 先判断缓存数据数据中是否有 data，如果没有，则什么都不做。
- 再判断是否还存于新鲜时间内，有则不用请求，直接返回数据。没有则先返回数据，但请求依然继续。

```ts
// 请求开始前
onBefore: (params) => {
  // 获取缓存数据
  const cacheData = _getCache(cacheKey, params);

  if (!cacheData || !Object.hasOwnProperty.call(cacheData, 'data')) {
    return {};
  }

  // 如果还存于新鲜时间内，则不用请求
  // If the data is fresh, stop request
  if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
    return {
      loading: false,
      data: cacheData?.data,
      returnNow: true, // 控制直接返回
    };
  } else {
    // If the data is stale, return data, and request continue
    return {
      data: cacheData?.data,
    };
  }
},
```

### onRequest

在请求阶段，最主要做的一件事就是缓存 promise。保证同一时间点，采用了同一个 cacheKey 的请求只有一个请求被发起。

```ts
onRequest: (service, args) => {
  // 看 promise 有没有缓存
  // 假如 promise 已经执行完成，则为 undefined。也就是没有同样 cacheKey 在执行。
  let servicePromise = cachePromise.getCachePromise(cacheKey);

  // If has servicePromise, and is not trigger by self, then use it
  // 如果有servicePromise，并且不等于之前自己触发的请求，那么就使用它。
  if (servicePromise && servicePromise !== currentPromiseRef.current) {
    return { servicePromise };
  }

  servicePromise = service(...args);
  // 保存本次触发的 promise 值
  currentPromiseRef.current = servicePromise;
  // 设置 promise 缓存
  cachePromise.setCachePromise(cacheKey, servicePromise);
  return { servicePromise };
},
```

重点看下 cachePromise 的实现，其逻辑在 packages/hooks/src/useRequest/src/utils/cachePromise.ts 中。

这里有意思的点是，我们不能缓存最后的 promise.finally 结果，因为它们的引用是不同的，而是应该直接缓存整个 promise。然后它执行完成的时候，将该缓存删除。

```ts
type CachedKey = string | number;
// 缓存 promise
const cachePromise = new Map<CachedKey, Promise<any>>();

// 获取 promise
const getCachePromise = (cacheKey: CachedKey) => {
  return cachePromise.get(cacheKey);
};

const setCachePromise = (cacheKey: CachedKey, promise: Promise<any>) => {
  // 应该缓存相同的 promise，不能是 promise.finally
  // Should cache the same promise, cannot be promise.finally
  // 因为 promise.finally 会改变 promise 的引用
  // Because the promise.finally will change the reference of the promise
  cachePromise.set(cacheKey, promise);

  // no use promise.finally for compatibility
  // 不使用 promise.finally 来兼容
  promise
    .then(res => {
      // 在 then 和 cache 中都将 promise 缓存删除
      cachePromise.delete(cacheKey);
      return res;
    })
    .catch(() => {
      cachePromise.delete(cacheKey);
    });
};

export { getCachePromise, setCachePromise };
```

### onSuccess & onMutate

最后在请求成功或者手动修改 data 的时候，执行的逻辑是类似的。

- 取消订阅。
- 更新设置缓存值。
- 重新订阅。

```ts
unSubscribeRef.current?.();
_setCache(cacheKey, {
  data,
  params: fetchInstance.state.params,
  time: new Date().getTime(),
});
// resubscribe
unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, d => {
  fetchInstance.setState({ data: d });
});
```
