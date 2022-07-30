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
      title: '指南',
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
  menus: {
    '/hooks': [
      {
        title: 'useRequest',
        children: ['hooks/request/request'],
      },
      {
        title: 'Scene',
        children: ['hooks/scene/useAntdTable', 'hooks/scene/usePagination'],
      },
      {
        title: 'LifeCycle',
        children: ['hooks/lifeCycle/index'],
      },
      {
        title: 'State',
        children: [
          'hooks/state/useSetState',
          'hooks/state/toggle',
          'hooks/state/useUrlState',
          'hooks/state/useCookieState',
          'hooks/state/storage',
          'hooks/state/useMap',
          'hooks/state/useSet',
          'hooks/state/usePrevious',
          'hooks/state/useRafState',
          'hooks/state/useSafeState',
          'hooks/state/useGetState',
        ],
      },
      {
        title: 'Effect',
        children: [
          'hooks/effect/handleTime',
          'hooks/effect/useAsyncEffect',
          'hooks/effect/timer',
          'hooks/effect/rafTimer',
          'hooks/effect/useLockFn',
        ],
      },
      {
        title: 'Dom',
        children: [
          'hooks/dom/useEventListener',
          'hooks/dom/useClickAway',
          'hooks/dom/useDocumentVisibility',
          'hooks/dom/useEventTarget',
          'hooks/dom/useTitle',
          'hooks/dom/useFavicon',
          'hooks/dom/useFullscreen',
          'hooks/dom/useHover',
        ],
      },
      {
        title: 'Advanced',
      },
      {
        title: 'Dev',
      },
    ],
  },
  // more config: https://d.umijs.org/config
});
