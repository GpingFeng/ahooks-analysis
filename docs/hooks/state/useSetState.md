# useSetState

> 管理 object 类型 state 的 Hooks，用法与 class 组件的 this.setState 基本一致。

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-set-state)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useSetState/index.ts)

先来了解一下可变数据和不可变数据的含义和区别如下：

- 可变数据(mutable)即一个数据被创建之后，可以随时进行修改，修改之后会影响到原值。
- 不可变数据(Immutable) 就是一旦创建，就不能再被更改的数据。对 `Immutable` 对象的任何修改或添加删除操作都会返回一个新的 `Immutable` 对象。

我们知道，React Function Components 中的 State 是不可变数据。所以我们经常需要写类似如下的代码：

```js
setObj(prev => ({
  ...prev,
  name: 'Gopal',
  others: {
    ...prev.others,
    age: '27',
  },
}));
```

通过 useSetState，可以省去对象扩展运算符操作这个步骤，即：

```js
setObj(prev => ({
  name: 'Gopal',
  others: {
    age: '27',
  },
}));
```

其内部实现也比较简单，如下所示：

- 调用设置值方法的时候，会根据传入的值是否为函数。如果是函数，则入参为旧状态，输出新的状态。否则直接作为新状态。这个符合 setState 的使用方法。
- 使用对象拓展运算符，返回新的对象，保证原有数据不可变。

```ts
const useSetState = <S extends Record<string, any>>(
  initialState: S | (() => S),
): [S, SetState<S>] => {
  const [state, setState] = useState<S>(initialState);

  // 合并操作，并返回一个全新的值
  const setMergeState = useCallback(patch => {
    setState(prevState => {
      // 新状态
      const newState = isFunction(patch) ? patch(prevState) : patch;
      // 也可以通过类似 Object.assign 的方式合并
      // 对象拓展运算符，返回新的对象，保证原有数据不可变
      return newState ? { ...prevState, ...newState } : prevState;
    });
  }, []);

  return [state, setMergeState];
};
```

可以看到，其实就是将对象拓展运算符的操作封装到内部。

还有其他更优雅的方式？我们可以使用 [use-immer](https://github.com/immerjs/use-immer)

> `useImmer(initialState)` 非常类似于 `useState`。该函数返回一个元组，元组的第一个值是当前状态，第二个是 `updater` 函数，它接受一个 `immer producer` 函数或一个值作为参数。

使用如下：

```js
const [person, updatePerson] = useImmer({
  name: 'Michel',
  age: 33,
});

function updateName(name) {
  updatePerson(draft => {
    draft.name = name;
  });
}

function becomeOlder() {
  updatePerson(draft => {
    draft.age++;
  });
}
```

当向更新函数传递一个函数的时候，`draft` 参数可以自由地改变，直到 `producer` 函数结束，所做的改变将是不可变的，并成为下一个状态。这更符合我们的使用习惯，可以通过 `draft.xx.yy` 的方式更新我们对象的值。
