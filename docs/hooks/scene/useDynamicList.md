# useDynamicList

> 一个帮助你管理动态列表状态，并能生成唯一 key 的 Hook。

其原理上就是对数组常见操作进行了封装。有一些比较基础，直接看代码注释即可。

## 生成唯一的 key

通过 useRef 返回同一个 ref 对象，每次设置的时候都自增 1，从而保证生成唯一的 key。keyList 中某个 item 的索引跟其对应源数据 item 索引保持一致。

```ts
// 当前的指向
const counterRef = useRef(-1);
// key List
const keyList = useRef<number[]>([]);
// 设置唯一的 key，通过 ref 保证 key 的唯一性
const setKey = useCallback((index: number) => {
  // 每次都加1
  counterRef.current += 1;
  // 将 key 值放入到列表中
  keyList.current.splice(index, 0, counterRef.current);
}, []);
```

## 初始数据的处理

通过 useState 设置初始化数据。

```ts
// 列表设置
const [list, setList] = useState(() => {
  initialList.forEach((_, index) => {
    setKey(index);
  });
  return initialList;
});
```

## resetList - 重设 list

```ts
// 重置 list，重新设置 list 的值
const resetList = useCallback((newList: T[]) => {
  // 先重置 key
  keyList.current = [];
  setList(() => {
    // 设置 key
    newList.forEach((_, index) => {
      setKey(index);
    });
    return newList;
  });
}, []);
```

## insert - 在指定位置插入元素

通过 splice 方法进行处理。

```ts
// 在指定位置插入元素
const insert = useCallback((index: number, item: T) => {
  setList(l => {
    const temp = [...l];
    temp.splice(index, 0, item);
    setKey(index);
    return temp;
  });
}, []);
```

## getKey - 获取 key 值

```ts
// 获取某个元素的 key 值
const getKey = useCallback((index: number) => keyList.current[index], []);
```

## getIndex - 获取某个值下标

```ts
// 获取某个值的下标
const getIndex = useCallback(
  (key: number) => keyList.current.findIndex(ele => ele === key),
  [],
);
```

## merge - 合并列表

```ts
// 将两个列表合并
const merge = useCallback((index: number, items: T[]) => {
  setList(l => {
    // 维护一个临时列表
    const temp = [...l];
    // 设置 key
    items.forEach((_, i) => {
      setKey(index + i);
    });
    // 合并
    temp.splice(index, 0, ...items);
    return temp;
  });
}, []);
```

## replace - 替换某个元素

```ts
// 替换
const replace = useCallback((index: number, item: T) => {
  setList(l => {
    const temp = [...l];
    temp[index] = item;
    return temp;
  });
}, []);
```

## remove - 移除某项

这里除了移除数组中的某项，还需要移除 keyList 中的值，只是这里还做了错误捕获，这个没想到会是什么场景。

```ts
// 移除
const remove = useCallback((index: number) => {
  setList(l => {
    const temp = [...l];
    temp.splice(index, 1);

    // remove keys if necessary
    try {
      keyList.current.splice(index, 1);
    } catch (e) {
      console.error(e);
    }
    return temp;
  });
}, []);
```

## move - 移动元素

```ts
// 移动元素
const move = useCallback((oldIndex: number, newIndex: number) => {
  if (oldIndex === newIndex) {
    return;
  }
  setList(l => {
    // 维护一个临时数组
    const newList = [...l];
    // 过滤掉「源数据下标项」
    const temp = newList.filter((_, index: number) => index !== oldIndex);
    // 插入到目标下标项中
    temp.splice(newIndex, 0, newList[oldIndex]);

    // move keys if necessary
    try {
      // 维护 keyList
      const keyTemp = keyList.current.filter(
        (_, index: number) => index !== oldIndex,
      );
      keyTemp.splice(newIndex, 0, keyList.current[oldIndex]);
      keyList.current = keyTemp;
    } catch (e) {
      console.error(e);
    }

    return temp;
  });
}, []);
```

## push - 在列表末尾添加元素

```ts
// 在列表末尾添加元素
const push = useCallback((item: T) => {
  setList(l => {
    setKey(l.length);
    return l.concat([item]);
  });
}, []);
```

## pop - 移除末尾项

```ts
// 移除末尾项
const pop = useCallback(() => {
  // remove keys if necessary
  try {
    keyList.current = keyList.current.slice(0, keyList.current.length - 1);
  } catch (e) {
    console.error(e);
  }

  setList(l => l.slice(0, l.length - 1));
}, []);
```

## unshift - 在起始位置添加元素

```ts
// 在列表起始位置添加元素
const unshift = useCallback((item: T) => {
  setList(l => {
    setKey(0);
    return [item].concat(l);
  });
}, []);
```

## shift - 移除起始位置元素

```ts
const shift = useCallback(() => {
  // remove keys if necessary
  try {
    keyList.current = keyList.current.slice(1, keyList.current.length);
  } catch (e) {
    console.error(e);
  }
  setList(l => l.slice(1, l.length));
}, []);
```

## sortList - 校准排序

为什么要校对？

```ts
// 校准排序
const sortList = useCallback(
  (result: T[]) =>
    result
      .map((item, index) => ({ key: index, item })) // add index into obj
      .sort((a, b) => getIndex(a.key) - getIndex(b.key)) // sort based on the index of table
      .filter(item => !!item.item) // remove undefined(s)
      .map(item => item.item), // retrive the data
  [],
);
```
