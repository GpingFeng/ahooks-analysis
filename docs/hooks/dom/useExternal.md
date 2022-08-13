# useExternal

> 动态注入 JS 或 CSS 资源，useExternal 可以保证资源全局唯一。

其实现原理创建 link 标签加载 CSS 资源或者 script 标签加载 JS 资源。通过 document.createElement 返回 Element 对象，监听该对象获取加载状态。

主函数中判断加载 CSS 还是 JS 资源：

```ts
const pathname = path.replace(/[|#].*$/, '');
// 判断是 CSS 类型
if (
  options?.type === 'css' ||
  (!options?.type && /(^css!|\.css$)/.test(pathname))
) {
  const result = loadCss(path, options?.css);
  ref.current = result.ref;
  setStatus(result.status);
  // 判断是是 JavaScript 类型
} else if (
  options?.type === 'js' ||
  (!options?.type && /(^js!|\.js$)/.test(pathname))
) {
  const result = loadScript(path, options?.js);
  ref.current = result.ref;
  setStatus(result.status);
} else {
  // do nothing
  console.error(
    "Cannot infer the type of external resource, and please provide a type ('js' | 'css'). " +
      'Refer to the https://ahooks.js.org/hooks/dom/use-external/#options',
  );
}
```

先看 loadCss 方法，加载 CSS 资源：

```ts
const loadCss = (path: string, props = {}): loadResult => {
  const css = document.querySelector(`link[href="${path}"]`);
  // 没有，则创建
  if (!css) {
    const newCss = document.createElement('link');

    newCss.rel = 'stylesheet';
    newCss.href = path;
    // 设置相应的属性
    Object.keys(props).forEach(key => {
      newCss[key] = props[key];
    });
    // IE9+
    const isLegacyIECss = 'hideFocus' in newCss;
    // use preload in IE Edge (to detect load errors)
    // preload 预加载
    if (isLegacyIECss && newCss.relList) {
      newCss.rel = 'preload';
      newCss.as = 'style';
    }
    // 正在加载中
    newCss.setAttribute('data-status', 'loading');
    // 在 head 标签中插入
    document.head.appendChild(newCss);

    return {
      // 返回
      ref: newCss,
      status: 'loading',
    };
  }

  // 有则直接返回，并取 data-status 中的值
  return {
    ref: css,
    status: (css.getAttribute('data-status') as Status) || 'ready',
  };
};
```

然后是 loadScript 加载 JS 资源：

```ts
// 加载 Script
const loadScript = (path: string, props = {}): loadResult => {
  // 看是否已经加载
  const script = document.querySelector(`script[src="${path}"]`);

  if (!script) {
    // 创建标签
    const newScript = document.createElement('script');
    // 设置 src
    newScript.src = path;
    // 设置属性值
    Object.keys(props).forEach(key => {
      newScript[key] = props[key];
    });

    // 设置 loading 状态
    newScript.setAttribute('data-status', 'loading');
    // 加到 document.body 中
    document.body.appendChild(newScript);

    return {
      ref: newScript,
      status: 'loading',
    };
  }

  return {
    ref: script,
    // 状态
    status: (script.getAttribute('data-status') as Status) || 'ready',
  };
};
```

最后监听 Element 的 load 和 error 事件，判断其加载状态：

```ts
const handler = (event: Event) => {
  // 判断和设置加载状态
  const targetStatus = event.type === 'load' ? 'ready' : 'error';
  ref.current?.setAttribute('data-status', targetStatus);
  setStatus(targetStatus);
};

// 监听文件下载的情况
ref.current.addEventListener('load', handler);
ref.current.addEventListener('error', handler);
```
