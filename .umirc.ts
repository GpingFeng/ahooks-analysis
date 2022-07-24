import { defineConfig } from 'dumi';

const repo = 'ahooks-analysis';

export default defineConfig({
  title: 'ahooks analysis',
  favicon:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  logo:
    'https://user-images.githubusercontent.com/9554297/83762004-a0761b00-a6a9-11ea-83b4-9c8ff721d4b8.png',
  outputPath: 'docs-dist',
  mode: 'site',
  hash: true,
  // Because of using GitHub Pages
  base: `/${repo}/`,
  publicPath: `/${repo}/`,
  mfsu: {},
  navs: [
    {
      title: 'Guide',
      path: '/zh-CN/guide',
    },
    {
      title: 'Hooks',
      path: '/zh-CN/hooks',
    },
    {
      title: 'GitHub',
      path: 'https://github.com/GpingFeng/ahooks-analysis',
    },
    {
      title: 'ahooks 官网',
      path: 'https://ahooks.gitee.io/zh-CN',
    },
  ],
  menus: {
    '/zh-CN/guide': [
      {
        title: '介绍',
        path: '/guide',
      },
      // {
      //   title: 'v2 to v3',
      //   path: '/guide/upgrade',
      // },
      // {
      //   title: 'DOM 类 Hooks 使用规范',
      //   path: '/guide/dom',
      // },
      // {
      //   title: 'blog',
      //   children: [
      //     {
      //       title: 'ahooks 输入输出函数处理规范',
      //       path: '/zh-CN/guide/blog/function',
      //     },
      //     {
      //       title: 'React Hooks & SSR',
      //       path: '/zh-CN/guide/blog/ssr',
      //     },
      //     {
      //       title: 'React Hooks & react-refresh（HMR）',
      //       path: '/zh-CN/guide/blog/hmr',
      //     },
      //     {
      //       title: 'React Hooks & strict mode',
      //       path: '/zh-CN/guide/blog/strict',
      //     },
      //   ],
      // },
    ],
    '/zh-CN/hooks/request': [
      {
        title: 'useRequest',
        children: ['/hooks/request/index'],
      },
    ],
  },
  // locales: [['zh-CN', '中文']],
  // more config: https://d.umijs.org/config
});
