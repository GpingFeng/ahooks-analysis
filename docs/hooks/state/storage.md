# Storage

ahooks 封装了 useLocalStorageState 和 useSessionStorageState。将状态存储在 localStorage 和 sessionStorage 中的 Hook 。

两者的使用方法是一样的，因为官方都是用的同一个方法去封装的。我们以 useLocalStorageState 为例。

可以看到 useLocalStorageState 其实是调用 createUseStorageState 方法返回的结果。该方法的入参会判断是否为浏览器环境，以决定是否使用 localStorage，原因在于 ahooks 需要支持服务端渲染。

```js
import { createUseStorageState } from '../createUseStorageState';
import isBrowser from '../utils/isBrowser';

const useLocalStorageState = createUseStorageState(() =>
  isBrowser ? localStorage : undefined,
);

export default useLocalStorageState;
```

我们重点关注一下，createUseStorageState 方法。

- 先是调用传入的参数。假如报错会及时 catch。这是因为：
  - 这里返回的 storage 可以看到其实可能是 undefined 的，后面都会有 catch 的处理。
  - 另外，从这个 [issue](https://github.com/alibaba/hooks/issues/800 'issue') 中可以看到 cookie 被 disabled 的时候，也是访问不了 localStorage 的。[stackoverflow](https://stackoverflow.com/questions/26550770/can-session-storage-local-storage-be-disabled-and-cookies-enabled 'stackoverflow') 也有这个讨论。（奇怪的知识又增加了）

```js
export function createUseStorageState(getStorage: () => Storage | undefined) {
  function useStorageState<T>(key: string, options?: Options<T>) {
    let storage: Storage | undefined;
    // https://github.com/alibaba/hooks/issues/800
    try {
      storage = getStorage();
    } catch (err) {
      console.error(err);
    }
    // 代码在后面讲解
}
```

- 支持自定义序列化方法。没有则直接 JSON.stringify。
- 支持自定义反序列化方法。没有则直接 JSON.parse。
- getStoredValue 获取 storage 的默认值，如果本地没有值，则返回默认值。
- 当传入 key 更新的时候，重新赋值。

```js
// 自定义序列化方法
const serializer = (value: T) => {
  if (options?.serializer) {
    return options?.serializer(value);
  }
  return JSON.stringify(value);
};

// 自定义反序列化方法
const deserializer = (value: string) => {
  if (options?.deserializer) {
    return options?.deserializer(value);
  }
  return JSON.parse(value);
};

function getStoredValue() {
  try {
    const raw = storage?.getItem(key);
    if (raw) {
      return deserializer(raw);
    }
  } catch (e) {
    console.error(e);
  }
  // 默认值
  if (isFunction(options?.defaultValue)) {
    return options?.defaultValue();
  }
  return options?.defaultValue;
}

const [state, setState] =
  (useState < T) | (undefined > (() => getStoredValue()));

// 当 key 更新的时候执行
useUpdateEffect(() => {
  setState(getStoredValue());
}, [key]);
```

最后是更新 storage 的函数：

- 如果是值为 undefined，则 removeItem，移除该 storage。
- 如果为函数，则取执行后结果。
- 否则，直接取值。

```js
// 设置 State
const updateState = (value?: T | IFuncUpdater<T>) => {
  // 如果是 undefined，则移除选项
  if (isUndef(value)) {
    setState(undefined);
    storage?.removeItem(key);
    // 如果是function，则用来传入 state，并返回结果
  } else if (isFunction(value)) {
    const currentState = value(state);
    try {
      setState(currentState);
      storage?.setItem(key, serializer(currentState));
    } catch (e) {
      console.error(e);
    }
  } else {
    // 设置值
    try {
      setState(value);
      storage?.setItem(key, serializer(value));
    } catch (e) {
      console.error(e);
    }
  }
};
```
