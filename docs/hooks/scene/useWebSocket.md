# useWebSocket

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-web-socket)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useWebSocket/index.ts)

> 用于处理 WebSocket 的 Hook。

主要原理是基于 WebSocket，进行一些逻辑封装，比如错误重试逻辑，组件清除后自动 disconnect 等。

可以先看下类型定义，我们可以直观知道 WebSocket 的状态有四种，见 ReadyState：

- 0 (WebSocket.CONNECTING)。正在链接中。
- 1 (WebSocket.OPEN)。已经链接并且可以通讯。
- 2 (WebSocket.CLOSING)。连接正在关闭。
- 3 (WebSocket.CLOSED)。连接已关闭或者没有链接成功。

另外可以看到 typescript 内部有对 WebSocket 回调事件（WebSocketEventMap）以及其实例（WebSocket）的申明。

```ts
export enum ReadyState {
  Connecting = 0,
  Open = 1,
  Closing = 2,
  Closed = 3,
}

export interface Options {
  reconnectLimit?: number;
  reconnectInterval?: number;
  manual?: boolean;
  onOpen?: (event: WebSocketEventMap['open'], instance: WebSocket) => void;
  onClose?: (event: WebSocketEventMap['close'], instance: WebSocket) => void;
  onMessage?: (
    message: WebSocketEventMap['message'],
    instance: WebSocket,
  ) => void;
  onError?: (event: WebSocketEventMap['error'], instance: WebSocket) => void;

  protocols?: string | string[];
}

export interface Result {
  latestMessage?: WebSocketEventMap['message'];
  sendMessage?: WebSocket['send'];
  disconnect?: () => void;
  connect?: () => void;
  readyState: ReadyState;
  webSocketIns?: WebSocket;
}
```

看入参、状态声明以及返回：

```ts
export default function useWebSocket(
  // socketUrl。必填，webSocket 地址
  socketUrl: string,
  // 连接配置项
  options: Options = {},
): Result {
  const {
    reconnectLimit = 3,
    // 重试时间间隔（ms）
    reconnectInterval = 3 * 1000,
    manual = false,
    onOpen,
    onClose,
    onMessage,
    onError,
    protocols,
  } = options;

  const onOpenRef = useLatest(onOpen);
  const onCloseRef = useLatest(onClose);
  const onMessageRef = useLatest(onMessage);
  const onErrorRef = useLatest(onError);

  const reconnectTimesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const websocketRef = useRef<WebSocket>();

  const unmountedRef = useRef(false);

  const [latestMessage, setLatestMessage] = useState<
    WebSocketEventMap['message']
  >();
  const [readyState, setReadyState] = useState<ReadyState>(ReadyState.Closed);

  // 省略中间...

  return {
    latestMessage,
    sendMessage: useMemoizedFn(sendMessage),
    connect: useMemoizedFn(connect),
    disconnect: useMemoizedFn(disconnect),
    // 当前 webSocket 连接状态
    readyState,
    // webSocket 实例
    webSocketIns: websocketRef.current,
  };
}
```

再来看 webSocket 的连接，其中会对相关的回调事件进行处理：

```ts
// 创建链接
const connectWs = () => {
  // 假如存在重试的逻辑，则清除掉其定时器
  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current);
  }
  // 先关闭之前的
  if (websocketRef.current) {
    websocketRef.current.close();
  }

  // new WebSocket
  const ws = new WebSocket(socketUrl, protocols);
  setReadyState(ReadyState.Connecting);

  // webSocket 错误回调
  ws.onerror = event => {
    if (unmountedRef.current) {
      return;
    }
    // 进行重试
    reconnect();
    // 错误的回调
    onErrorRef.current?.(event, ws);
    setReadyState(ws.readyState || ReadyState.Closed);
  };
  // webSocket 连接成功回调
  ws.onopen = event => {
    if (unmountedRef.current) {
      return;
    }
    // webSocket 连接成功回调
    onOpenRef.current?.(event, ws);
    reconnectTimesRef.current = 0;
    setReadyState(ws.readyState || ReadyState.Open);
  };
  // webSocket 收到消息回调
  ws.onmessage = (message: WebSocketEventMap['message']) => {
    if (unmountedRef.current) {
      return;
    }
    // webSocket 收到消息回调
    onMessageRef.current?.(message, ws);
    setLatestMessage(message);
  };
  // webSocket 关闭回调
  ws.onclose = event => {
    if (unmountedRef.current) {
      return;
    }
    reconnect();
    // webSocket 关闭回调
    onCloseRef.current?.(event, ws);
    setReadyState(ws.readyState || ReadyState.Closed);
  };
  // 保存 websocket  实例
  websocketRef.current = ws;
};
```

上面当 WebSocket 错误的时候，onerror 回调中，我们会调用 reconnect 进行重试。我们来看下 reconnect 函数：

```ts
// 重试。重新连接
const reconnect = () => {
  if (
    // 没有超过连接次数或者没有连接成功
    reconnectTimesRef.current < reconnectLimit &&
    websocketRef.current?.readyState !== ReadyState.Open
  ) {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    // 定时重连
    reconnectTimerRef.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      connectWs();
      reconnectTimesRef.current++;
    }, reconnectInterval);
  }
};
```

封装暴露常见操作：发送信息，断开，连接等方法：

```ts
// 发送消息函数
const sendMessage: WebSocket['send'] = message => {
  if (readyState === ReadyState.Open) {
    websocketRef.current?.send(message);
  } else {
    throw new Error('WebSocket disconnected');
  }
};

// 手动连接 webSocket，如果当前已有连接，则关闭后重新连接
const connect = () => {
  reconnectTimesRef.current = 0;
  connectWs();
};

// 手动断开 webSocket 连接
const disconnect = () => {
  if (reconnectTimerRef.current) {
    clearTimeout(reconnectTimerRef.current);
  }

  reconnectTimesRef.current = reconnectLimit;
  websocketRef.current?.close();
};
```

socketUrl 更新的时候，manual 为 false，则自动连接：

```ts
useEffect(() => {
  // 如果手动，则不会触发连接
  if (!manual) {
    connect();
  }
}, [socketUrl, manual]);
```

组件销毁的时候，则断开：

```ts
useUnmount(() => {
  unmountedRef.current = true;
  disconnect();
});
```
