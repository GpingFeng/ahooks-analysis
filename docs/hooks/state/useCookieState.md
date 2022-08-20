# useCookieState

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-cookie-state)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useCookieState/index.ts)

ahooks 封装了 useCookieState，一个可以将状态存储在 Cookie 中的 Hook 。

该 hook 使用了 [js-cookie](https://www.npmjs.com/package/js-cookie 'js-cookie') 这个 npm 库。我认为选择它的理由有以下：

- 包体积小。压缩后小于 800 字节。自身是没有其它依赖的。这对于原本就是一个工具库的 ahooks 来讲是很重要的。
- 更好的兼容性。支持所有的浏览器。并支持任意的字符。

当然，它还有其他的特点，比如支持 ESM/AMD/CommonJS 方式导入等等。

封装的代码并不复杂，先看默认值的设置，其优先级如下：

- 本地 cookie 中已有该值，则直接取。
- 设置的值为字符串，则直接返回。
- 设置的值为函数，执行该函数，返回函数执行结果。
- 返回 options 中设置的 defaultValue。

```js
const [state, setState] =
  useState <
  State >
  (() => {
    // 假如有值，则直接返回
    const cookieValue = Cookies.get(cookieKey);

    if (isString(cookieValue)) return cookieValue;
    // 定义 Cookie 默认值，但不同步到本地 Cookie
    // 可以自定义默认值
    if (isFunction(options.defaultValue)) {
      return options.defaultValue();
    }

    return options.defaultValue;
  });
```

再看设置 cookie 的逻辑 —— `updateState` 方法。

- 在使用 `updateState` 方法的时候，开发者可以传入新的 options —— newOptions。会与 useCookieState 设置的 options 进行 merge 操作。最后除了 defaultValue 会透传给 js-cookie 的 set 方法的第三个参数。
- 获取到 cookie 的值，判断传入的值，假如是函数，则取执行后返回的结果，否则直接取该值。
- 如果值为 undefined，则清除 cookie。否则，调用 js-cookie 的 set 方法。
- 最终返回 cookie 的值以及设置的方法。

```ts
// 设置 Cookie 值
const updateState = useMemoizedFn(
  (
    newValue: State | ((prevState: State) => State),
    newOptions: Cookies.CookieAttributes = {},
  ) => {
    const { defaultValue, ...restOptions } = { ...options, ...newOptions };
    setState(prevState => {
      const value = isFunction(newValue) ? newValue(prevState) : newValue;
      // 值为 undefined 的时候，清除 cookie
      if (value === undefined) {
        Cookies.remove(cookieKey);
      } else {
        Cookies.set(cookieKey, value, restOptions);
      }
      return value;
    });
  },
);

return [state, updateState] as const;
```
