# useFavicon

- [文档地址](https://ahooks.js.org/zh-CN/hooks/use-favicon)

- [详细代码](https://github.com/GpingFeng/hooks/blob/guangping%2Fread-code/packages/hooks/src/useFavicon/index.ts)

> 设置页面的 favicon。

favicon 指的是页面 Tab 的这个 ICON。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9897604c441943e88e62d188df98ffc0~tplv-k3u1fbpfcp-zoom-1.image)

原理是通过 link 标签设置 favicon。

```ts
const useFavicon = (href: string) => {
  useEffect(() => {
    if (!href) return;

    const cutUrl = href.split('.');
    const imgSuffix = cutUrl[cutUrl.length - 1].toLocaleUpperCase() as ImgTypes;

    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") ||
      document.createElement('link');
    // 用于定义链接的内容的类型。
    link.type = ImgTypeMap[imgSuffix];
    // 指定被链接资源的URL。
    link.href = href;
    // 此属性命名链接文档与当前文档的关系。
    link.rel = 'shortcut icon';

    document.getElementsByTagName('head')[0].appendChild(link);
  }, [href]);
};
```
