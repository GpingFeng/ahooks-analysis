# useKeyPress

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-key-press)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useKeyPress/index.ts)

> 监听键盘按键，支持组合键，支持按键别名。

其实现原理是监听 keydown 或者 keyup 事件，在回调对 keyFilter 配置进行判断，如果触发了配置的场景，则触发我们传入的 eventHandler 回调。

主函数比较简单，直接看源码：

- events 是一个数组，可以配置 keydown 或者 keyup。

```ts
const defaultEvents: KeyEvent[] = ['keydown'];
// 监听键盘按键，支持组合键，支持按键别名。
function useKeyPress(
  keyFilter: KeyFilter,
  eventHandler: EventHandler,
  option?: Options,
) {
  // 默认 defaultEvents 是 keydown
  const { events = defaultEvents, target, exactMatch = false } = option || {};
  const eventHandlerRef = useLatest(eventHandler);
  const keyFilterRef = useLatest(keyFilter);

  useDeepCompareEffectWithTarget(
    () => {
      const el = getTargetElement(target, window);
      if (!el) {
        return;
      }

      const callbackHandler = (event: KeyboardEvent) => {
        const genGuard: KeyPredicate = genKeyFormater(
          keyFilterRef.current,
          exactMatch,
        );
        // 判断是否触发配置 keyFilter 场景
        if (genGuard(event)) {
          return eventHandlerRef.current?.(event);
        }
      };

      // 监听传入事件
      for (const eventName of events) {
        el?.addEventListener?.(eventName, callbackHandler);
      }
      // 取消监听
      return () => {
        for (const eventName of events) {
          el?.removeEventListener?.(eventName, callbackHandler);
        }
      };
    },
    [events],
    target,
  );
}
```

重点看 genKeyFormater 函数，它是键盘输入预处理方法，主要是针对几种传入的场景进行处理，留意注释。其中返回的是一个判断函数，假如传入的是 keyFilter 是一个自定义函数，则直接根据 event 参数判断按键是否激活。

另外支持 keyCode、别名、组合键、数组。其内部都是调用的 genFilterKey 判断按键是否激活。

```ts
/**
 * 键盘输入预处理方法
 * @param [keyFilter: any] 当前键
 * @returns () => Boolean
 */
function genKeyFormater(
  keyFilter: KeyFilter,
  exactMatch: boolean,
): KeyPredicate {
  // 支持自定义函数
  if (isFunction(keyFilter)) {
    return keyFilter;
  }
  // 支持 keyCode、别名、组合键
  if (isString(keyFilter) || isNumber(keyFilter)) {
    return (event: KeyboardEvent) => genFilterKey(event, keyFilter, exactMatch);
  }
  // 支持数组
  if (Array.isArray(keyFilter)) {
    return (event: KeyboardEvent) =>
      keyFilter.some(item => genFilterKey(event, item, exactMatch));
  }
  return keyFilter ? () => true : () => false;
}
```

genFilterKey 函数如下所示：

```ts
/**
 * 判断按键是否激活
 * @param [event: KeyboardEvent]键盘事件
 * @param [keyFilter: any] 当前键
 * @returns Boolean
 */
function genFilterKey(
  event: KeyboardEvent,
  keyFilter: keyType,
  exactMatch: boolean,
) {
  // 浏览器自动补全 input 的时候，会触发 keyDown、keyUp 事件，但此时 event.key 等为空
  if (!event.key) {
    return false;
  }

  // 数字类型直接匹配事件的 keyCode
  if (isNumber(keyFilter)) {
    return event.keyCode === keyFilter;
  }

  // 字符串依次判断是否有组合键
  const genArr = keyFilter.split('.');
  let genLen = 0;

  for (const key of genArr) {
    // 组合键
    const genModifier = modifierKey[key];
    // keyCode 别名
    const aliasKeyCode = aliasKeyCodeMap[key.toLowerCase()];

    if (
      (genModifier && genModifier(event)) ||
      (aliasKeyCode && aliasKeyCode === event.keyCode)
    ) {
      genLen++;
    }
  }

  /**
   * 需要判断触发的键位和监听的键位完全一致，判断方法就是触发的键位里有且等于监听的键位
   * genLen === genArr.length 能判断出来触发的键位里有监听的键位
   * countKeyByEvent(event) === genArr.length 判断出来触发的键位数量里有且等于监听的键位数量
   * 主要用来防止按组合键其子集也会触发的情况，例如监听 ctrl+a 会触发监听 ctrl 和 a 两个键的事件。
   */
  if (exactMatch) {
    return genLen === genArr.length && countKeyByEvent(event) === genArr.length;
  }
  return genLen === genArr.length;
}
```

最后官方支持的按键别名见 [代码](https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useKeyPress/index.ts#L21)

修饰键:

```
ctrl
alt
shift
meta
```
