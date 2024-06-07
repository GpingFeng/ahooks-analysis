import { defineConfig } from 'dumi';

const repo = 'ahooks-analysis';

export default defineConfig({
  title: 'ahooks analysis',
  favicon: `/${repo}/images/logo.png`,
  logo: `/${repo}/images/logo.png`,
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
      title: 'ahooks 官网',
      path: 'https://ahooks.gitee.io/zh-CN',
    },
    {
      title: 'GitHub',
      path: 'https://github.com/GpingFeng/ahooks-analysis',
    },
    {
      title: '关于我',
      path: 'https://github.com/GpingFeng',
    },
  ],
  locales: [['zh-CN', '中文']],
  menus: {
    '/hooks': [
      {
        title: 'useRequest',
        children: [
          'hooks/request/useRequest',
          'hooks/request/useLoadingDelayPlugin',
          'hooks/request/usePollingPlugin',
          'hooks/request/useAutoRunPlugin',
          'hooks/request/useRefreshOnWindowFocusPlugin',
          'hooks/request/useThrottlePlugin',
          'hooks/request/useCachePlugin',
          'hooks/request/useRetryPlugin',
        ],
      },
      {
        title: 'Scene',
        children: [
          'hooks/scene/useAntdTable',
          'hooks/scene/useFusionTable',
          'hooks/scene/useInfiniteScroll',
          'hooks/scene/usePagination',
          'hooks/scene/useDynamicList',
          'hooks/scene/useVirtualList',
          'hooks/scene/useHistoryTravel',
          'hooks/scene/useNetwork',
          'hooks/scene/useSelections',
          'hooks/scene/useCountdown',
          'hooks/scene/useCounter',
          'hooks/scene/useTextSelection',
          'hooks/scene/useWebSocket',
        ],
      },
      {
        title: 'LifeCycle',
        children: [
          'hooks/lifeCycle/useMount',
          'hooks/lifeCycle/useUnmount',
          'hooks/lifeCycle/useUnmountedRef',
        ],
      },
      {
        title: 'State',
        children: [
          'hooks/state/useSetState',
          'hooks/state/toggle',
          'hooks/state/useUrlState',
          'hooks/state/useCookieState',
          'hooks/state/storage',
          'hooks/state/useDebounce',
          'hooks/state/useThrottle',
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
          'hooks/effect/useUpdateEffect',
          'hooks/effect/useAsyncEffect',
          'hooks/effect/useDebounceEffect',
          'hooks/effect/useDebounceFn',
          'hooks/effect/useThrottleFn',
          'hooks/effect/useThrottleEffect',
          'hooks/effect/useDeepCompareEffect',
          'hooks/effect/timer',
          'hooks/effect/RafTimer',
          'hooks/effect/useLockFn',
          'hooks/effect/useUpdate',
        ],
      },
      {
        title: 'Dom',
        children: [
          'hooks/dom/useEventListener',
          'hooks/dom/useClickAway',
          'hooks/dom/useDocumentVisibility',
          'hooks/dom/useDrop',
          'hooks/dom/useEventTarget',
          'hooks/dom/useExternal',
          'hooks/dom/useTitle',
          'hooks/dom/useFavicon',
          'hooks/dom/useFullscreen',
          'hooks/dom/useHover',
          'hooks/dom/useInViewport',
          'hooks/dom/useKeyPress',
          'hooks/dom/useLongPress',
          'hooks/dom/useMouse',
          'hooks/dom/useResponsive',
          'hooks/dom/useScroll',
          'hooks/dom/useSize',
          'hooks/dom/useFocusWithin',
        ],
      },
      {
        title: 'Advanced',
        children: [
          'hooks/advanced/useControllableValue',
          'hooks/advanced/useCreation',
          'hooks/advanced/useEventEmitter',
          'hooks/advanced/useIsomorphicLayoutEffect',
          'hooks/advanced/useLatest',
          'hooks/advanced/useMemoizedFn',
          'hooks/advanced/useReactive',
        ],
      },
      {
        title: 'Dev',
        children: [
          'hooks/dev/useTrackedEffect',
          'hooks/dev/useWhyDidYouUpdate',
        ],
      },
      {
        title: 'Utils',
        children: ['hooks/utils/debounceAndThrottle', 'hooks/utils/rect'],
      },
    ],
  },
  // more config: https://d.umijs.org/config
});
