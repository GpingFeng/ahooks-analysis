# useCounter

> 管理计数器的 Hook。

其实现原理很简单，就是暴露相应方法对数值进行管理。

初始化数据：

```ts
const { min, max } = options;

const [current, setCurrent] = useState(() => {
  return getTargetValue(initialValue, {
    min,
    max,
  });
});
```

getTargetValue 获取目标数值，必须大于等于 min，小于等于 max。

```ts
function getTargetValue(val: number, options: Options = {}) {
  const { min, max } = options;
  let target = val;
  if (isNumber(max)) {
    target = Math.min(max, target);
  }
  if (isNumber(min)) {
    target = Math.max(min, target);
  }
  return target;
}
```

setValue 设置值，可以留意其入参类型设置。

```ts
export type ValueParam = number | ((c: number) => number);
// 设置值。value 值支持 number 和 function
const setValue = (value: ValueParam) => {
  setCurrent(c => {
    const target = isNumber(value) ? value : value(c);
    return getTargetValue(target, {
      max,
      min,
    });
  });
};
```

inc/dec/set/reset 方法都是调用的 setValue 方法。

```ts
// 增加。增加维度默认为 1
const inc = (delta: number = 1) => {
  setValue(c => c + delta);
};

// 减少。减少区间默认为 1
const dec = (delta: number = 1) => {
  setValue(c => c - delta);
};

const set = (value: ValueParam) => {
  setValue(value);
};

// 重设会初始值
const reset = () => {
  setValue(initialValue);
};
```
