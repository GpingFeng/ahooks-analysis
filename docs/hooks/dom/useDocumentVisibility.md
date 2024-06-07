# useDocumentVisibility

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-document-visibility)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useDocumentVisibility/index.ts)

> 监听页面是否可见。

这个 hook 主要使用了 Document.visibilityState 这个 API。先简单看下这个 API：

`Document.visibilityState` （只读属性）, 返回 document 的可见性， 即当前可见元素的上下文环境。由此可以知道当前文档 (即为页面) 是在背后， 或是不可见的隐藏的标签页，或者 (正在) 预渲染。可用的值如下：

- 'visible' : 此时页面内容至少是部分可见. 即此页面在前景标签页中，并且窗口没有最小化。
- 'hidden' : 此时页面对用户不可见。即文档处于背景标签页或者窗口处于最小化状态，或者操作系统正处于 '锁屏状态' 。
- 'prerender' : 页面此时正在渲染中，因此是不可见的。文档只能从此状态开始，永远不能从其他值变为此状态。

典型用法是防止当页面正在渲染时加载资源，或者当页面在背景中或窗口最小化时禁止某些活动。

最后看这个 hook 的实现就很简单了：

- 通过 document.visibilityState 判断是否可见。
- 通过 visibilitychange 事件，更新结果。

```ts
const getVisibility = () => {
  if (!isBrowser) {
    return 'visible';
  }
  //  Document.visibilityState （只读属性）, 返回document的可见性， 即当前可见元素的上下文环境。
  return document.visibilityState;
};

function useDocumentVisibility(): VisibilityState {
  const [documentVisibility, setDocumentVisibility] = useState(() =>
    getVisibility(),
  );

  useEventListener(
    // 监听该事件
    'visibilitychange',
    () => {
      setDocumentVisibility(getVisibility());
    },
    {
      target: () => document,
    },
  );
  return documentVisibility;
}
```
