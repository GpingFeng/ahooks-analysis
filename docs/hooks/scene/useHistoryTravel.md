# useHistoryTravel

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-history-travel)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useHistoryTravel/index.ts)

> 管理状态历史变化记录，方便在历史记录中前进与后退。

实现原理，其在内部维护了以下的数据结构。通过队列的方式维护过去和未来的列表。

```ts
// 定义数据类型。其中 past 和 future 维护一个队列。
interface IData<T> {
  present?: T;
  past: T[];
  future: T[];
}
```

## reset - 重置

直接将 present 值设置为初始值或者入参中的第一个值。并重置 future 和 past。

```ts
// 重置
const reset = (...params: any[]) => {
  // 重置到初始值，或提供一个新的初始值
  const _initial = params.length > 0 ? params[0] : initialValueRef.current;
  initialValueRef.current = _initial;

  setHistory({
    present: _initial,
    future: [],
    past: [],
  });
};
```

## setValue - 设置 value

其对应的方法是 updateValue。直接看代码：

```ts
// 更新，都是往过去的list中添加
const updateValue = (val: T) => {
  setHistory({
    present: val,
    // future 直接置空
    future: [],
    // 之前的 past 和 present 都将称为 past
    past: [...past, present],
  });
};
```

## \_forward & \_backward - 前进和后退

不管前进还是后退，都是调用 `split` 函数。不同的是前进则第二个参数传递的是 feature，后退则第二个参数传递的是 past。

```ts
// 前进，默认前进一步
const _forward = (step: number = 1) => {
  if (future.length === 0) {
    return;
  }
  // 前进则第二个参数传递的是 feature
  const { _before, _current, _after } = split(step, future);
  setHistory({
    // 旧状态，加上现在以及刚过去的
    past: [...past, present, ..._before],
    // 当前
    present: _current,
    future: _after,
  });
};

// 后退，默认后退一步
const _backward = (step: number = -1) => {
  if (past.length === 0) {
    return;
  }

  // 后端则第二个参数传递的是 past
  const { _before, _current, _after } = split(step, past);
  setHistory({
    past: _before,
    present: _current,
    future: [..._after, present, ...future],
  });
};
```

split 函数主要的作用将传入 targetArr，根据 step，分成当前状态、之前、未来的状态。

比如前进，出参为 2 和 [1,2,3,4]，得到的结果是 `{ _current: 2, _before: [1], _after: [3,4] }`。
比如前进，出参为 -1，[1,2,3,4]，得到的结果是 `{ _current: 4, _before: [1, 2, 3], _after: [] }`。

```ts
// 获取 current 值的下标
const dumpIndex = <T>(step: number, arr: T[]) => {
  let index =
    // 当值大于 0 的时候，前进
    step > 0
      ? step - 1 // move forward
      : arr.length + step; // move backward
  if (index >= arr.length - 1) {
    index = arr.length - 1;
  }
  if (index < 0) {
    index = 0;
  }
  return index;
};

// 将传入 targetArr，根据 step，分成当前状态、之前、未来的状态
// 比如 2，[1,2,3,4] { _current: 2, _before: [1], _after: [3,4] }
// 比如 -1，[1,2,3,4] { _current: 4, _before: [1, 2, 3], _after: [] }
const split = <T>(step: number, targetArr: T[]) => {
  // 获取 current 值的下标
  const index = dumpIndex(step, targetArr);
  return {
    _current: targetArr[index],
    _before: targetArr.slice(0, index),
    _after: targetArr.slice(index + 1),
  };
};
```

## go - 跳到具体某一步

最终调用 \_forward 和 \_backward

```ts
// 跳到第几步，最终调用 _forward 和 _backward
const go = (step: number) => {
  const stepNum = isNumber(step) ? step : Number(step);
  if (stepNum === 0) {
    return;
  }
  if (stepNum > 0) {
    return _forward(stepNum);
  }
  _backward(stepNum);
};
```
