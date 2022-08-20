# useSet

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-set)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useSet/index.ts)

> 管理 Set 类型状态的 Hook。

直接看代码。

默认值的设置，通过 **new Set() 构造函数，创建一个新的 Set 对象**。

```ts
function useSet<K>(initialValue?: Iterable<K>) {
  const getInitValue = () => {
    return initialValue === undefined ? new Set<K>() : new Set(initialValue);
  };

  const [set, setSet] = useState<Set<K>>(() => getInitValue());
  // 省略一些代码
}
```

add 方法添加一个元素。**调用 Set 的 add 方法，在 Set 对象尾部添加一个元素**。返回该 Set 对象。

```ts
const add = (key: K) => {
  if (set.has(key)) {
    return;
  }
  setSet(prevSet => {
    const temp = new Set(prevSet);
    temp.add(key);
    return temp;
  });
};
```

remove 方法移除一个元素。**调用 Set 的 delete(value) 方法，移除 Set 中与这个值相等的元素**，返回 Set.prototype.has(value) 在这个操作前会返回的值（即如果该元素存在，返回 true，否则返回 false）。Set.prototype.has(value) 在此后会返回 false。

```ts
// 移除
const remove = (key: K) => {
  if (!set.has(key)) {
    return;
  }
  setSet(prevSet => {
    const temp = new Set(prevSet);
    temp.delete(key);
    return temp;
  });
};
```

reset 方法，重置 Set 回默认值。其对应的 **Set 的 clear 方法，会移除 Set 对象内的所有元素**。

```
// 重置
const reset = () => setSet(getInitValue());
```

其他 Set 方法：

- entries()。返回一个新的迭代器对象，**该对象包含 Set 对象中的按插入顺序排列的所有元素的值的 [value, value] 数组**。为了使这个方法和 Map 对象保持相似， 每个值的键和值相等。
- has(value)。返回一个布尔值，表示该值在 Set 中存在与否。
- keys() 和 values()。都返回一个新的迭代器对象，该对象包含 Set 对象中的按插入顺序排列的所有元素的值。
- forEach(callbackFn[, thisArg])。按照插入顺序，为 Set 对象中的每一个值调用一次 callBackFn。**如果提供了 thisArg 参数，回调中的 this 会是这个参数**。

## 思考与总结

ES6 中的 Map 和 Set 两种数据结构，弥补了 JavaScript 之前的一些不足，比如 Object 对象只能是 string 或者 Symbol 类型。另外，提供了某些情况下更便捷的操作方式，比如数组去重，我们可以直接 `new Set([...arr])`。

现在越来越多的场景使用了 Map 和 Set，ahooks 对这两者的封装都比较简单，更多的是一些有副作用（修改到原 Map 和 Set）操作的封装。看这部分的源码，就当做小小复习基础知识吧。
