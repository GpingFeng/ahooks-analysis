# useMap

[文档地址](https://ahooks.js.org/zh-CN/hooks/use-map)

[详细代码](https://github.com/GpingFeng/hooks/blob/guangping/read-code/packages/hooks/src/useMap/index.ts)

> 管理 Map 类型状态的 Hook。

先回顾以下 Map 的概念。Map 对象保存键值对，并且能够**记住键的原始插入顺序**。**任何值**（对象或者基本类型）都可以作为一个键或一个值。

Object 和 Map 很类似。它们都允许你按键存取一个值、删除键、检测一个键是否绑定了值。因此过去我们一直都把对象当成 Map 使用。

但是，在一些场景下，使用 Map 是更优的选择，以下是一些常见的点：

- 键值的类型。一个 Map 的键可以是任意值，包括函数、对象或任意基本类型。一个 Object 的键必须是一个 String 或是 Symbol。
- 需要保证键值的顺序。Map 中的键是有序的。因此，当迭代的时候，一个 Map 对象**以插入的顺序**返回键值。虽然 Object 的键目前是有序的，但并不总是这样，而且这个顺序是复杂的。因此，**最好不要依赖属性的顺序**。
- Size。Map 的键值对个数可以轻易地通过 size 属性获取。Object 的键值对个数只能手动计算。比如遍历对象属性，计算它的个数。
- 性能。Map 在**频繁增删键值对的场景**下表现更好。Object 在频繁添加和删除键值对的场景下未作出优化。

更多，可以看 [Objects 和 maps 的比较](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map#objects_%E5%92%8C_maps_%E7%9A%84%E6%AF%94%E8%BE%83)。

我们来看下 ahooks 做了哪些封装，同时回顾以下 Map 的一些基础 API 用法。

首先是默认值的设置，通过 Map 构造函数 `new Map()` 创建 Map 对象。入参为默认值。

```ts
function useMap<K, T>(
  // 传入默认的 Map 参数
  initialValue?: Iterable<readonly [K, T]>,
) {
  const getInitValue = () => {
    return initialValue === undefined ? new Map() : new Map(initialValue);
  };

  const [map, setMap] = useState<Map<K, T>>(() => getInitValue());
  // 省略代码...
}
```

set 方法。添加 Map 新的 key 和 value 或者更新 key 的值，因为 React 是不可变数据，需要要返回一个全新的值，所以需要创建一个新的 Map 对象。

通过 Map 的 set 方法，在 Map 对象中**设置与指定的键 key 关联的值 value**，并返回 Map 对象。

```ts
// 添加 map
const set = (key: K, entry: T) => {
  setMap(prev => {
    const temp = new Map(prev);
    temp.set(key, entry);
    return temp;
  });
};
```

remove 方法。通过 Map 的 delete 方法，**移除 Map 对象中指定的键值对**，如果键值对存在并成功被移除，返回 true，否则返回 false。调用 delete 后再调用 Map.prototype.has(key) 将返回 false。

```ts
// 移除
const remove = (key: K) => {
  setMap(prev => {
    const temp = new Map(prev);
    temp.delete(key);
    return temp;
  });
};
```

- setAll 方法。传入一个全新的 Map 对象，直接覆盖旧的 Map 对象。
- reset 方法。重置 Map 对象为初始值。在 Map 中有一个 clear 的方法，它**移除 Map 对象中所有的键值对**，相比 clear，reset 方法更贴近我们的需求。
- get 方法，通过 Map 的 get 方法，**返回与 key 关联的值**，若不存在关联的值，则返回 undefined。

```ts
// 生成一个新的 Map 对象
const setAll = (newMap: Iterable<readonly [K, T]>) => {
  setMap(new Map(newMap));
};
// 重置
const reset = () => setMap(getInitValue());
// 获取
const get = (key: K) => map.get(key);
```

对于一些其他没有副作用的方法，ahooks 没有封装，我觉得是合理的，这些在开发者想用的时候，直接调用就可以了。

- has(key)。返回一个布尔值，用来**表明 Map 对象中是否存在与 key 关联的值**。
- keys()。返回一个新的迭代对象，其中**包含 Map 对象中所有的键，并以插入 Map 对象的顺序排列**。
- values()。返回一个新的迭代对象，其中**包含 Map 对象中所有的值，并以插入 Map 对象的顺序排列**。
- entries()。返回一个新的迭代对象，其为一个**包含 Map 对象中所有键值对的 [key, value] 数组，并以插入 Map 对象的顺序排列**。
