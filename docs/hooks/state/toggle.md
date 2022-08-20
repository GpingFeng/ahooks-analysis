# useBoolean 和 useToggle

文档地址

- [useToggle](https://ahooks.js.org/zh-CN/hooks/use-toggle)
- [useBoolean](https://ahooks.js.org/zh-CN/hooks/use-boolean)

详细代码:

- [useToggle](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useToggle/index.ts)
- [useBoolean](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useBoolean/index.ts)

## useBoolean 和 useToggle

这两个都是特殊情况下的值管理。

> useBoolean，优雅的管理 boolean 状态的 Hook。

> useToggle，用于在两个状态值间切换的 Hook。

实际上，useBoolean 又是 useToggle 的一个特殊使用场景。

先看 useToggle。

- 这里使用了 typescript 函数重载声明入参和出参类型，根据不同的入参会返回不同的结果。比如第一个入参为 boolean 布尔值，则返回一个元组，第一项为 boolean 值，第二个为更新函数。优先级从上到下依次变低。
- 入参可能有两个值，第一个为默认值（认为是左值），第二个是取反之后的值（认为是右值），可以不传，不传的时候，则直接根据默认值取反 `!defaultValue`。
- toggle 函数。切换值，也就是上面的左值和右值的转换。
- set。直接设置值。
- setLeft。设置默认值（左值）。
- setRight。如果传入了 reverseValue, 则设置为 reverseValue。 否则设置为 defautValue 的取反值。

```ts
// TS 函数重载的使用
function useToggle<T = boolean>(): [boolean, Actions<T>];

function useToggle<T>(defaultValue: T): [T, Actions<T>];

function useToggle<T, U>(
  defaultValue: T,
  reverseValue: U,
): [T | U, Actions<T | U>];

function useToggle<D, R>(
  // 默认值
  defaultValue: D = (false as unknown) as D,
  // 取反
  reverseValue?: R,
) {
  const [state, setState] = useState<D | R>(defaultValue);

  const actions = useMemo(() => {
    const reverseValueOrigin = (reverseValue === undefined
      ? !defaultValue
      : reverseValue) as D | R;

    // 切换 state
    const toggle = () =>
      setState(s => (s === defaultValue ? reverseValueOrigin : defaultValue));
    // 修改 state
    const set = (value: D | R) => setState(value);
    // 设置为 defaultValue
    const setLeft = () => setState(defaultValue);
    // 如果传入了 reverseValue, 则设置为 reverseValue。 否则设置为 defautValue 的反值
    const setRight = () => setState(reverseValueOrigin);

    return {
      toggle,
      set,
      setLeft,
      setRight,
    };
    // useToggle ignore value change
    // }, [defaultValue, reverseValue]);
  }, []);

  return [state, actions];
}
```

而 useBoolean 是对 useToggle 的一个使用。如下，比较简单，不细说

```ts
export default function useBoolean(defaultValue = false): [boolean, Actions] {
  const [state, { toggle, set }] = useToggle(defaultValue);

  const actions: Actions = useMemo(() => {
    const setTrue = () => set(true);
    const setFalse = () => set(false);
    return {
      toggle,
      set: v => set(!!v),
      setTrue,
      setFalse,
    };
  }, []);

  return [state, actions];
}
```
