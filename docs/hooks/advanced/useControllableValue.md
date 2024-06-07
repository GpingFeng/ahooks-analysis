# useControllableValue

- [文档地址看这里](https://ahooks.js.org/zh-CN/hooks/use-controllable-value)

- [详细代码看这里](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useControllableValue/index.ts)

> 在某些组件开发时，我们需要组件的状态既可以自己管理，也可以被外部控制，useControllableValue 就是帮你管理这种状态的 Hook。

官方[受控组件](https://zh-hans.reactjs.org/docs/forms.html#controlled-components)和[非受控组件](https://zh-hans.reactjs.org/docs/uncontrolled-components.html)的解释。

> 受控组件：在 HTML 中，表单元素（如`<input>`、 `<textarea>` 和 `<select>`）通常自己维护 state，并根据用户输入进行更新。而在 React 中，可变状态（mutable state）通常保存在组件的 state 属性中，并且只能通过使用 setState()来更新。对于受控组件来说，输入的值始终由 React 的 state 驱动。你也可以将 value 传递给其他 UI 元素，或者通过其他事件处理函数重置，但这意味着你需要编写更多的代码。

> 非受控组件：使用非受控组件，这时表单数据将交由 DOM 节点来处理。可以使用 ref 来从 DOM 节点中获取表单数据。

其主要实现原理判断当前组件是否为受控组件（如果 props 中有 value，则是受控）。如果是非受控，则维护内部 state 状态。假如是受控组件，则由父级接管控制 state。只要 props 中有 trigger 字段，则在 state 变化时，就会触发 trigger 函数。

整体实现如下所示，直接看代码：

```ts
function useControllableValue<T = any>(
  props: StandardProps<T>,
): [T, (v: SetStateAction<T>) => void];
function useControllableValue<T = any>(
  // props，组件的 props
  props?: Props,
  // 可选配置项
  options?: Options<T>,
): [T, (v: SetStateAction<T>, ...args: any[]) => void];
function useControllableValue<T = any>(
  props: Props = {},
  options: Options<T> = {},
) {
  const {
    // 默认值，会被 props.defaultValue 和 props.value 覆盖
    defaultValue,
    // 默认值的属性名
    defaultValuePropName = 'defaultValue',
    // 值的属性名
    valuePropName = 'value',
    // 修改值时，触发的函数
    trigger = 'onChange',
  } = options;

  const value = props[valuePropName] as T;
  // 如果有value，则是受控
  const isControlled = props.hasOwnProperty(valuePropName);

  const initialValue = useMemo(() => {
    // 如果是受控，则返回值
    if (isControlled) {
      return value;
    }
    // 处理默认值
    if (props.hasOwnProperty(defaultValuePropName)) {
      return props[defaultValuePropName];
    }
    return defaultValue;
  }, []);

  const stateRef = useRef(initialValue);
  // 受控组件，则由外部传入的 value 更新 state
  if (isControlled) {
    stateRef.current = value;
  }

  // 更新组件
  const update = useUpdate();

  // 设置值方法
  function setState(v: SetStateAction<T>, ...args: any[]) {
    const r = isFunction(v) ? v(stateRef.current) : v;
    // 非受控组件，则自己更新状态
    if (!isControlled) {
      stateRef.current = r;
      update();
    }
    // 传了 trigger 函数。则触发 trigger 函数，trigger 函数默认为 onChange 事件
    if (props[trigger]) {
      props[trigger](r, ...args);
    }
  }

  return [stateRef.current, useMemoizedFn(setState)] as const;
}
```
