# useRafInterval 和 useRafTimeout

- [文档地址](https://ahooks.js.org/zh-CN/hooks/-raf-timer)

详细代码

- [useRafInterval](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRafInterval/index.ts)
- [useRafInterval](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useRafTimeout/index.ts)

## setTimeout 和 setInterval 的问题

首先，setTimeout 和 setInterval 作为事件循环中宏任务的“两大主力”，它的执行时机不能跟我们预期一样准确的，它需要等待前面任务的执行。比如下面的 setTimeout 的第二个参数设置为 0，并不会立即执行。

```js
setTimeout(() => {
  console.log('test');
}, 0);
```

另外还有一种情况，setTimeout 和 setInterval 在浏览器不可见的时候（比如最小化的时候），不同的浏览器中设置不同的时间间隔的时候，其表现不一样。根据 [当浏览器切换到其他标签页或者最小化时，你的 js 定时器还准时吗？](https://juejin.cn/post/6899796711401586695#comment '当浏览器切换到其他标签页或者最小化时，你的js定时器还准时吗？') 这篇文章的实践结论如下：

> 谷歌浏览器中，当页面处于不可见状态时，setInterval 的最小间隔时间会被限制为 1s。火狐浏览器的 setInterval 和谷歌特性一致，但是 ie 浏览器没有对不可见状态时的 setInterval 进行性能优化，不可见前后间隔时间不变。

> 在谷歌浏览器中，setTimeout 在浏览器不可见状态下间隔低于 1s 的会变为 1s，大于等于 1s 的会变成 N+1s 的间隔值。火狐浏览器下 setTimeout 的最小间隔时间会变为 1s,大于等于 1s 的间隔不变。ie 浏览器在不可见状态前后的间隔时间不变。

这个结论，我没有验证过，但看起来差异挺大，其中还提到了另外一个选择，就是 requestAnimationFrame。

window.requestAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行

为了提高性能和电池寿命，因此在大多数浏览器里，当 requestAnimationFrame() 运行在后台标签页或者隐藏的 `<iframe>` 里时，**requestAnimationFrame() 会被暂停调用以提升性能和电池寿命**。

所以，ahooks 也提供了使用 `requestAnimationFrame` 进行模拟定时器处理的 hook，我们一起来看下。

## useRafInterval 和 useRafTimeout

直接看 `useRafInterval`。（useRafTimeout 和 useRafInterval 类似，这里不展开细说）。

```js
function useRafInterval(
  fn: () => void,
  delay: number | undefined,
  options?: {
    immediate?: boolean,
  },
) {
  const immediate = options?.immediate;
  const fnRef = useLatest(fn);

  useEffect(() => {
    // 省略部分代码...
    const timer = setRafInterval(() => {
      fnRef.current();
    }, delay);
    return () => {
      clearRafInterval(timer);
    };
  }, [delay]);
}
```

可以看到，跟前面的 useInterval 大部分代码逻辑都是一样的，只是定时使用了 `setRafInterval` 方法，清除定时器用了 `clearRafInterval`。

### setRafInterval

直接上代码：

```js
const setRafInterval = function(
  callback: () => void,
  delay: number = 0,
): Handle {
  if (typeof requestAnimationFrame === typeof undefined) {
    // 如果不支持，还是使用 setInterval
    return {
      id: setInterval(callback, delay),
    };
  }
  // 开始时间
  let start = new Date().getTime();
  const handle: Handle = {
    id: 0,
  };
  const loop = () => {
    const current = new Date().getTime();
    // 当前时间 - 开始时间，大于设置的间隔，则执行，并重置开始时间
    if (current - start >= delay) {
      callback();
      start = new Date().getTime();
    }
    handle.id = requestAnimationFrame(loop);
  };
  handle.id = requestAnimationFrame(loop);
  return handle;
};
```

首先是用 typeof 判断进行兼容逻辑处理，假如不兼容，则兜底使用 setInterval。

初始记录一个 start 的时间。

在 requestAnimationFrame 回调中，判断现在的时间减去开始时间有没有达到间隔，假如达到则执行我们的 callback 函数。更新开始时间。

### clearRafInterval

清除定时器。

```js
function cancelAnimationFrameIsNotDefined(t: any): t is NodeJS.Timer {
  return typeof cancelAnimationFrame === typeof undefined;
}

// 清除定时器
const clearRafInterval = function (handle: Handle) {
  if (cancelAnimationFrameIsNotDefined(handle.id)) {
    return clearInterval(handle.id);
  }
  cancelAnimationFrame(handle.id);
};
```

假如不支持 `cancelAnimationFrame` API，则通过 clearInterval 清除，支持则直接使用 cancelAnimationFrame 清除。

## 思考与总结

关于定时器，我们平时用得不少，但经常有同学容易忘记清除定时器，结合 `useEffect` 返回清除副作用函数这个特性，我们可以将这类逻辑一起封装到 hook 中，让开发者使用更加方便。

另外，假如希望在页面不可见的时候，不执行定时器，可以选择 useRafInterval 和 useRafTimeout，其内部是使用 `requestAnimationFrame` 进行实现。
