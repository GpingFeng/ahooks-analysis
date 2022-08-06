# useLatest

> 返回当前最新值的 Hook，可以避免闭包问题。

实现原理是通过 useRef，保持每次获取到的都是最新的值

```ts
import { useRef } from 'react';
// 通过 useRef，保持每次获取到的都是最新的值
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export default useLatest;
```

想了解更多，可以查看[这篇 blog](/guide/blog/closure.md)。
