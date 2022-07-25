# useFullscreen

> 管理 DOM 全屏的 Hook。

该 hook 主要是依赖 [screenfull](https://www.npmjs.com/package/screenfull) 这个 npm 包进行实现的。

选择它的原因，估计有两个：

- 它的兼容性好，兼容各个浏览器的全屏 API。
- 简单，包体积小。压缩后只要 1.1 k。

大概介绍几个它的 API。

- .request(element, options?)。使一个元素全屏显示。默认元素是 `<html>`
- .exit()。退出全屏。
- .toggle(element, options?)。假如目前是全屏，则退出，否则进入全屏。
- .on(event, function)。添加一个监听器，用于当浏览器切换到全屏或切换出全屏或出现错误时。event 支持 'change' 或者 'error'。另外两种写法：`.onchange(function)` 和 `.onerror(function)`。
- .isFullscreen。判断是否是全屏。
- .isEnabled。判断当前环境是否支持全屏。

来看该 hook 的封装：

首先是 onChange 事件中，判断是否是全屏，从而触发进入全屏的函数或者退出全屏的函数。
当退出全屏的时候，卸载 `change` 事件。

```ts
const { onExit, onEnter } = options || {};
// 退出全屏触发
const onExitRef = useLatest(onExit);
// 全屏触发
const onEnterRef = useLatest(onEnter);
const [state, setState] = useState(false);

const onChange = () => {
  if (screenfull.isEnabled) {
    const { isFullscreen } = screenfull;
    if (isFullscreen) {
      onEnterRef.current?.();
    } else {
      screenfull.off('change', onChange);
      onExitRef.current?.();
    }
    setState(isFullscreen);
  }
};
```

手动进入全屏函数，支持传入 ref 设置需要全屏的元素。并通过 `screenfull.request` 进行设置，并监听 change 事件。

```ts
// 进入全屏
const enterFullscreen = () => {
  const el = getTargetElement(target);
  if (!el) {
    return;
  }

  if (screenfull.isEnabled) {
    try {
      screenfull.request(el);
      screenfull.on('change', onChange);
    } catch (error) {
      console.error(error);
    }
  }
};
```

退出全屏方法，调用 `screenfull.exit()`。

```ts
// 退出全屏
const exitFullscreen = () => {
  if (!state) {
    return;
  }
  if (screenfull.isEnabled) {
    screenfull.exit();
  }
};
```

最后通过 toggleFullscreen，根据当前状态，调用上面两个方法，达到切换全屏状态的效果。

```ts
// 切换模式
const toggleFullscreen = () => {
  if (state) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
};
```
