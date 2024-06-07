# useUpdate

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-update)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useUpdate/index.ts)

> useUpdate 会返回一个函数，调用该函数会强制组件重新渲染。

返回的函数通过变更 useState 返回的 state，从而促使组件进行更新。

```js
import { useCallback, useState } from 'react';

const useUpdate = () => {
  const [, setState] = useState({});
  // 通过设置一个全新的状态，促使 function 组件更新
  return useCallback(() => setState({}), []);
};

export default useUpdate;
```

想了解更多，可以查看[这篇 blog](/guide/blog/handle-time.md)。
