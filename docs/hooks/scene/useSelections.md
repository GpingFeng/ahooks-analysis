# useSelections

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-selections)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useSelections/index.ts)

> 常见联动 Checkbox 逻辑封装，支持多选，单选，全选逻辑，还提供了是否选择，是否全选，是否半选的状态。

实现原理，维护所有项的值 items 数组以及设置选择的元素 setSelected（Set 数据结构）。

基本都是数组和 Set 的一些基础操作。可以直接看代码：

- 判断是否选中

```ts
// 判断是否选中
const isSelected = (item: T) => selectedSet.has(item);
```

- select - 选中

```ts
// 添加到选中的
const select = (item: T) => {
  selectedSet.add(item);
  // Array.from 将 Set 转换成数组
  return setSelected(Array.from(selectedSet));
};
```

- unSelect - 移除

```ts
// 从选中列表中山茶油
const unSelect = (item: T) => {
  selectedSet.delete(item);
  return setSelected(Array.from(selectedSet));
};
```

- toggle - 切换选中态

```ts
// 切换选中态
const toggle = (item: T) => {
  if (isSelected(item)) {
    unSelect(item);
  } else {
    select(item);
  }
};
```

- selectAll - 选中所有

```ts
// 选中所有
const selectAll = () => {
  items.forEach(o => {
    selectedSet.add(o);
  });
  setSelected(Array.from(selectedSet));
};
```

- unSelectAll - 去除所有选中

```ts
const unSelectAll = () => {
  items.forEach(o => {
    selectedSet.delete(o);
  });
  setSelected(Array.from(selectedSet));
};
```

- noneSelected - 判断是否一个都没有选中

```ts
// 判断是否一个都没有选中
const noneSelected = useMemo(() => items.every(o => !selectedSet.has(o)), [
  items,
  selectedSet,
]);
```

- allSelected - 是否所有的都选中

```ts
// 是否所有的都选中
const allSelected = useMemo(
  () => items.every(o => selectedSet.has(o)) && !noneSelected,
  [items, selectedSet, noneSelected],
);
```

- partiallySelected - 是否部分选中

```ts
// 是否部分选中
const partiallySelected = useMemo(() => !noneSelected && !allSelected, [
  noneSelected,
  allSelected,
]);
```

- toggleAll - 反转所有

```ts
// 反转所有
const toggleAll = () => (allSelected ? unSelectAll() : selectAll());
```
