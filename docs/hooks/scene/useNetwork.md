# useNetwork

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-network)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useNetwork/index.ts)

> 管理网络连接状态的 Hook。

实现原理是通过监听网络 online、offline、change 事件，并通过 [navigator 的 connection](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/connection) 获取到网络的情况。

## 获取网络状态

主要是通过以下 getConnectionProperty 方法获取，可以直接看注释。

```ts
// 获取网络状态
function getConnection() {
  const nav = navigator as any;
  if (!isObject(nav)) return null;
  // https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/type
  return nav.connection || nav.mozConnection || nav.webkitConnection;
}

function getConnectionProperty(): NetworkState {
  const c = getConnection();
  if (!c) return {};
  return {
    // NetworkInformation.rtt 是一个只读属性，返回了当前连接下评估的往返时延（RTT, round-trip time ），并保留该值为 25 千分秒的最接近的整数倍。
    rtt: c.rtt,
    // 返回设备正在与网络进行通信的连接类型。比如 wifi/bluetooth 等
    type: c.type,
    // 如果用户设备上设置了减少数据使用的选项时返回 true。
    saveData: c.saveData,
    // 有效带宽估算（单位：兆比特/秒）
    downlink: c.downlink,
    // 最大下行速度（单位：兆比特/秒）
    downlinkMax: c.downlinkMax,
    // 网络连接的类型，值有 'slow-2g', '2g', '3g', or '4g'.
    effectiveType: c.effectiveType,
  };
}
```

## 监听事件，更新网络情况

监听 online 事件，触发设置 online 为 true。

监听 offline 事件，触发设置 online 为 false。

监听网络波动，则对网络情况进行更新。

since 为最后一次更新的时间。

```ts
useEffect(() => {
  const onOnline = () => {
    setState(prevState => ({
      ...prevState,
      online: true,
      since: new Date(),
    }));
  };

  const onOffline = () => {
    setState(prevState => ({
      ...prevState,
      online: false,
      since: new Date(),
    }));
  };

  const onConnectionChange = () => {
    setState(prevState => ({
      ...prevState,
      ...getConnectionProperty(),
    }));
  };

  // 监听网络变化
  window.addEventListener(NetworkEventType.ONLINE, onOnline);
  window.addEventListener(NetworkEventType.OFFLINE, onOffline);

  const connection = getConnection();
  // 获取到 connection 对象，监听该对象的 change 事件
  connection?.addEventListener(NetworkEventType.CHANGE, onConnectionChange);

  return () => {
    window.removeEventListener(NetworkEventType.ONLINE, onOnline);
    window.removeEventListener(NetworkEventType.OFFLINE, onOffline);
    connection?.removeEventListener(
      NetworkEventType.CHANGE,
      onConnectionChange,
    );
  };
}, []);
```
