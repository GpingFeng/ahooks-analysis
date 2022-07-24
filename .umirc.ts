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
      path: '/guide',
    },
    {
      title: 'Hooks',
      path: '/hooks',
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
  locales: [['zh-CN', '中文']],
  // more config: https://d.umijs.org/config
});
