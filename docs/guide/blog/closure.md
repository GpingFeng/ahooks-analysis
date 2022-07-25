# 解决闭包问题

本文来探索一下 ahooks 是怎么解决 React 的闭包问题的？。

## React 的闭包问题

先来看一个例子：

```js
import React, { useState, useEffect } from 'react';

export default () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setInterval(() => {
      console.log('setInterval:', count);
    }, 1000);
  }, []);

  return (
    <div>
      count: {count}
      <br />
      <button onClick={() => setCount(val => val + 1)}>增加 1</button>
    </div>
  );
};
```

[代码示例](https://codesandbox.io/s/ji-chu-yong-fa-forked-wpk1s6?file=/App.tsx:0-487)

当我点击按钮的时候，发现 setInterval 中打印出来的值并没有发生变化，始终都是 0。这就是 React 的闭包问题。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4bf9f4acd4f547b7bc9257a15acbf51b~tplv-k3u1fbpfcp-zoom-1.image)

## 产生的原因

为了维护 Function Component 的 state，React 用链表的方式来存储 Function Component 里面的 hooks，并为每一个 hooks 创建了一个对象。

```
type Hook = {
  memoizedState: any,
  baseState: any,
  baseUpdate: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null,
};
```

这个对象的 `memoizedState` 属性就是用来存储组件上一次更新后的 `state`，`next` 指向下一个 hook 对象。**在组件更新的过程中，hooks 函数执行的顺序是不变的，就可以根据这个链表拿到当前 hooks 对应的 Hook 对象，函数式组件就是这样拥有了 state 的能力**。

同时制定了一系列的规则，比如不能将 hooks 写入到 `if...else...` 中。从而保证能够正确拿到相应 hook 的 state。

useEffect 接收了两个参数，一个回调函数和一个数组。数组里面就是 useEffect 的依赖，当为 [] 的时候，**回调函数只会在组件第一次渲染的时候执行一次**。如果有依赖其他项，react 会判断其依赖是否改变，如果改变了就会执行回调函数。

回到刚刚那个例子:

```js
const [count, setCount] = useState(0);

useEffect(() => {
  setInterval(() => {
    console.log('setInterval:', count);
  }, 1000);
}, []);
```

它第一次执行的时候，执行 useState，count 为 0。执行 useEffect，执行其回调中的逻辑，启动定时器，每隔 1s 输出 `setInterval: 0`。

当我点击按钮使 `count` 增加 1 的时候，整个函数式组件重新渲染，这个时候前一个执行的链表已经存在了。useState 将 Hook 对象 上保存的状态置为 1， 那么此时 count 也为 1 了。执行 useEffect，其依赖项为空，不执行回调函数。但是之前的回调函数还是在的，它还是会每隔 1s 执行 `console.log("setInterval:", count);`，但这里的 count 是之前第一次执行时候的 count 值，因为在定时器的回调函数里面被引用了，形成了闭包一直被保存。

## 解决的方法

解决方法一：给 useEffect 设置依赖项，重新执行函数，设置新的定时器，拿到最新值。

```js
// 解决方法一
useEffect(() => {
  if (timer.current) {
    clearInterval(timer.current);
  }
  timer.current = setInterval(() => {
    console.log('setInterval:', count);
  }, 1000);
}, [count]);
```

解决方法二：使用 useRef。
useRef 返回一个可变的 ref 对象，其 .current 属性被初始化为传入的参数（initialValue）。

**useRef 创建的是一个普通 Javascript 对象，而且会在每次渲染时返回同一个 ref 对象**，当我们变化它的 current 属性的时候，对象的引用都是同一个，所以定时器中能够读到最新的值。

```js
const lastCount = useRef(count);

// 解决方法二
useEffect(() => {
  setInterval(() => {
    console.log('setInterval:', lastCount.current);
  }, 1000);
}, []);

return (
  <div>
    count: {count}
    <br />
    <button
      onClick={() => {
        setCount(val => val + 1);
        // +1
        lastCount.current += 1;
      }}
    >
      增加 1
    </button>
  </div>
);
```

## useRef => useLatest

终于回到我们 ahooks 主题，基于上述的第二种解决方案，useLatest 这个 hook 随之诞生。它返回当前最新值的 Hook，可以避免闭包问题。实现原理很简单，只有短短的十行代码，就是使用 useRef 包一层：

```js
import { useRef } from 'react';
// 通过 useRef，保持每次获取到的都是最新的值
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export default useLatest;
```

## useEvent => useMemoizedFn

React 中另一个场景，是基于 useCallback 的。

```js
const [count, setCount] = useState(0);

const callbackFn = useCallback(() => {
  console.log(`Current count is ${count}`);
}, []);
```

以上不管，我们的 count 的值变化成多少，执行 callbackFn 打印出来的 count 的值始终都是 0。这个是因为回调函数被 useCallback 缓存，形成闭包，从而形成闭包陷阱。

那我们怎么解决这个问题呢？官方提出了 useEvent。它解决的问题：如何同时保持函数引用不变与访问到最新状态。使用它之后，上面的例子就变成了。

```js
const callbackFn = useEvent(() => {
  console.log(`Current count is ${count}`);
});
```

在这里我们不细看这个特性，实际上，在 ahooks 中已经实现了类似的功能，那就是 useMemoizedFn。

useMemoizedFn 是持久化 function 的 Hook，理论上，可以使用 useMemoizedFn 完全代替 useCallback。使用 useMemoizedFn，可以省略第二个参数 deps，同时保证函数地址永远不会变化。以上的问题，通过以下的方式就能轻松解决：

```js
const memoizedFn = useMemoizedFn(() => {
  console.log(`Current count is ${count}`);
});
```

[Demo 地址](https://codesandbox.io/s/ji-chu-yong-fa-forked-7pkp1r?file=/App.tsx)

我们来看下它的源码，可以看到其还是通过 useRef 保持 function 引用地址不变，并且每次执行都可以拿到最新的 state 值。

```js
function useMemoizedFn<T extends noop>(fn: T) {
  // 通过 useRef 保持其引用地址不变，并且值能够保持值最新
  const fnRef = useRef<T>(fn);
  fnRef.current = useMemo(() => fn, [fn]);
  // 通过 useRef 保持其引用地址不变，并且值能够保持值最新
  const memoizedFn = useRef<PickFunction<T>>();
  if (!memoizedFn.current) {
    // 返回的持久化函数，调用该函数的时候，调用原始的函数
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args);
    };
  }

  return memoizedFn.current as T;
}
```

## 总结与思考

React 自从引入 hooks，虽然解决了 class 组件的一些弊端，比如逻辑复用需要通过高阶组件层层嵌套等。但是也引入了一些问题，比如闭包问题。

这个是 React 的 Function Component State 管理导致的，有时候会让开发者产生疑惑。开发者可以通过添加依赖或者使用 useRef 的方式进行避免。

ahooks 也意识到了这个问题，通过 useLatest 保证获取到最新的值和 useMemoizedFn 持久化 function 的方式，避免类似的闭包陷阱。

值得一提的是 useMemoizedFn 是 ahooks 输出函数的标准，所有的输出函数都使用 `useMemoizedFn` 包一层。另外输入函数都使用 useRef 做一次记录，以保证在任何地方都能访问到最新的函数。

## 参考

- [从 react hooks“闭包陷阱”切入，浅谈 react hooks](https://juejin.cn/post/6844904193044512782)
- [React 官方团队出手，补齐原生 Hook 短板](https://segmentfault.com/a/1190000041798153)
