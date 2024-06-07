# useCountDown

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-count-down)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useCountDown/index.ts)

> 一个用于管理倒计时的 Hook。

其实现原理就是通过定时器 setInterval 进行设置倒计时，为负值时，停止倒计时。

初始化 state：

```ts
// 初始化 state
const [timeLeft, setTimeLeft] = useState(() => calcLeft(targetDate));
```

其中 calcLeft 方法是计算目标时间和当前时间之间还有多少毫秒，入参是目标时间：

```ts
// 计算目标时间和当前时间之间还有多少毫秒
const calcLeft = (t?: TDate) => {
  if (!t) {
    return 0;
  }
  // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
  // 计算剩余时间，目标时间 - 当前时间 > 0
  const left = dayjs(t).valueOf() - new Date().getTime();
  // 小于 0 的时候，返回 0，代表结束
  if (left < 0) {
    return 0;
  }
  return left;
};
```

通过定时器进行倒计时：

```ts
// 保证取到最新的值
const onEndRef = useLatest(onEnd);

useEffect(() => {
  if (!targetDate) {
    // for stop
    setTimeLeft(0);
    return;
  }

  // 立即执行一次
  setTimeLeft(calcLeft(targetDate));

  // 定时器
  const timer = setInterval(() => {
    const targetLeft = calcLeft(targetDate);
    setTimeLeft(targetLeft);
    // 剩余为 0，则取消定时器，并执行 onEnd 回调
    if (targetLeft === 0) {
      clearInterval(timer);
      onEndRef.current?.();
    }
  }, interval);

  return () => clearInterval(timer);
}, [targetDate, interval]);
```

最后针对返回的结果进行格式化：

```ts
// 格式化后的倒计时
const parseMs = (milliseconds: number): FormattedRes => {
  return {
    days: Math.floor(milliseconds / 86400000),
    hours: Math.floor(milliseconds / 3600000) % 24,
    minutes: Math.floor(milliseconds / 60000) % 60,
    seconds: Math.floor(milliseconds / 1000) % 60,
    milliseconds: Math.floor(milliseconds) % 1000,
  };
};

// 对结果进行 format
const formattedRes = useMemo(() => {
  return parseMs(timeLeft);
}, [timeLeft]);

// 将结果返回给开发者
return [timeLeft, formattedRes] as const;
```
