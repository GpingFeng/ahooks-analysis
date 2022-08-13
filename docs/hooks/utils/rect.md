## rect

[scrollTop](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop)

> Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。一个元素的 scrollTop 值是这个元素的内容顶部（卷起来的）到它的视口可见内容（的顶部）的距离的度量。当一个元素的内容没有产生垂直方向的滚动条，那么它的 scrollTop 值为 0。

[scrollHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight)

> Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。一个元素的 scrollTop 值是这个元素的内容顶部（卷起来的）到它的视口可见内容（的顶部）的距离的度量。当一个元素的内容没有产生垂直方向的滚动条，那么它的 scrollTop 值为 0。

[clientHeight](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/clientHeight)

> 这个属性是只读属性，对于没有定义 CSS 或者内联布局盒子的元素为 0，否则，它是元素内部的高度 (单位像素)，包含内边距，但不包括水平滚动条、边框和外边距。clientHeight 可以通过 CSS height + CSS padding - 水平滚动条高度 (如果存在) 来计算。

```ts
// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop
const getScrollTop = (el: Document | Element) => {
  if (el === document || el === document.body) {
    return Math.max(
      window.pageYOffset,
      document.documentElement.scrollTop,
      document.body.scrollTop,
    );
  }
  return (el as Element).scrollTop;
};
// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight
const getScrollHeight = (el: Document | Element) => {
  return (
    (el as Element).scrollHeight ||
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  );
};

// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/clientHeight
const getClientHeight = (el: Document | Element) => {
  return (
    (el as Element).clientHeight ||
    Math.max(document.documentElement.clientHeight, document.body.clientHeight)
  );
};

export { getScrollTop, getScrollHeight, getClientHeight };
```
