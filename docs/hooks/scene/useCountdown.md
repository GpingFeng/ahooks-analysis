# useCountdown

> 一个用于管理倒计时的 Hook。

其实现原理就是通过定时器 setInterval 进行设置倒计时，为负值时，停止倒计时。

初始化 state：

```ts
// 初始化 state
const [timeLeft, setTimeLeft] = useState(() => calcLeft(targetDate));
```

其中 calcLeft 是计算目标时间和当前时间之间还有多少毫秒：

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
// 对结果进行 format
const formattedRes = useMemo(() => {
  return parseMs(timeLeft);
}, [timeLeft]);
```
