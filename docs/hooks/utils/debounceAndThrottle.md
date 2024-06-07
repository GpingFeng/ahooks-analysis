# 防抖 & 节流

## 防抖

在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

简单实现：

```ts
/*
 * fn [function] 需要防抖的函数
 * delay [number] 毫秒，防抖期限值
 */
function debounce(fn, delay) {
  let timer = null; //借助闭包
  return function() {
    if (timer) {
      clearTimeout(timer); //进入该分支语句，说明当前正在一个计时过程中，并且又触发了相同事件。所以要取消当前的计时，重新开始计时
      timer = setTimeout(fn, delay);
    } else {
      timer = setTimeout(fn, delay); // 进入该分支说明当前并没有在计时，那么就开始一个计时
    }
  };
}
```

## 节流

n 秒内只运行一次，若在 n 秒内重复触发，只有一次生效。

简单实现：

```ts
function throttle(fn, delay) {
  let valid = true;
  return function() {
    if (!valid) {
      //休息时间 暂不接客
      return false;
    }
    // 工作时间，执行函数并且在间隔期内把状态位设为无效
    valid = false;
    setTimeout(() => {
      fn();
      valid = true;
    }, delay);
  };
}
```

## ahooks 的防抖和节流

ahooks 的防抖和节流都是基于 lodash 库。

- 防抖。[debounce](https://www.lodashjs.com/docs/lodash.debounce)
- 节流。[throttle](https://www.lodashjs.com/docs/lodash.throttle)

### 防抖 - useDebounceFn

```ts
function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(
        `useDebounceFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  // 默认是 1000 毫秒
  const wait = options?.wait ?? 1000;

  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        // options
        options,
      ),
    [],
  );

  // 卸载时候取消
  useUnmount(() => {
    debounced.cancel();
  });

  return {
    run: debounced,
    cancel: debounced.cancel,
    // flush 方法表示立即调用
    flush: debounced.flush,
  };
}
```

### 节流 - useThrottleFn

```ts
function useThrottleFn<T extends noop>(fn: T, options?: ThrottleOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(
        `useThrottleFn expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  const throttled = useMemo(
    () =>
      // 最终都是调用了 lodash 的节流函数
      throttle(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    // 取消
    cancel: throttled.cancel,
    // 立即调用
    flush: throttled.flush,
  };
}
```

TODO:针对 lodash 这两个方法源码解读。

## 参考

- [浅谈 JS 防抖和节流](https://segmentfault.com/a/1190000018428170)
