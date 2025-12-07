/**
 * 应用入口文件
 *
 * 负责初始化 React 应用、配置全局状态管理和路由系统。
 * 这是应用的启动点，所有全局配置都在这里完成。
 *
 * @module main
 */
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { DirectionProvider } from './context/direction-provider'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// 自动生成的路由树（由 TanStack Router 插件生成）
import { routeTree } from './routeTree.gen'
// 全局样式文件
import './styles/index.css'

/**
 * 创建 QueryClient 实例
 *
 * 配置 React Query 的默认选项和错误处理策略。
 * 这是全局数据获取和缓存管理的核心配置。
 *
 * @remarks
 * 配置项说明：
 * - **查询重试策略**：开发环境不重试，生产环境最多 3 次（401/403 除外）
 * - **数据缓存**：数据过期时间 10 秒，生产环境窗口聚焦时重新获取
 * - **错误处理**：统一处理服务器错误，特殊处理认证和权限错误
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * 查询重试逻辑
       *
       * @param failureCount - 当前重试次数
       * @param error - 错误对象
       * @returns 是否继续重试
       *
       * @remarks
       * - 开发环境：不重试，便于快速调试
       * - 生产环境：最多重试 3 次
       * - 401/403 错误：不重试，直接处理认证/权限问题
       */
      retry: (failureCount, error) => {
        // 开发环境输出重试信息
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        // 开发环境不重试
        if (failureCount >= 0 && import.meta.env.DEV) return false
        // 生产环境最多重试 3 次
        if (failureCount > 3 && import.meta.env.PROD) return false

        // 401/403 错误不重试
        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      /**
       * 窗口获得焦点时是否重新获取数据
       * 生产环境启用，开发环境禁用（避免干扰开发）
       */
      refetchOnWindowFocus: import.meta.env.PROD,
      /**
       * 数据过期时间（毫秒）
       * 数据在 10 秒内被认为是"新鲜"的，不会自动重新获取
       */
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      /**
       * 变更操作的全局错误处理
       *
       * @param error - 错误对象
       *
       * @remarks
       * - 统一调用 handleServerError 处理错误
       * - 特殊处理 304 状态码（内容未修改）
       */
      onError: (error) => {
        // 统一处理服务器错误
        handleServerError(error)

        // 特殊处理 304 状态码
        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('内容未修改！')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    /**
     * 查询缓存的全局错误处理
     *
     * @param error - 错误对象
     *
     * @remarks
     * 处理不同类型的 HTTP 错误：
     * - **401**：会话过期，清除认证状态并跳转登录页
     * - **403**：权限不足（当前仅记录，未跳转）
     * - **500**：服务器错误，生产环境跳转错误页面
     */
    onError: (error) => {
      if (error instanceof AxiosError) {
        // 401: 会话过期，跳转到登录页
        if (error.response?.status === 401) {
          toast.error('会话已过期！')
          // 清除认证状态
          useAuthStore.getState().auth.reset()
          // 保存当前页面 URL 作为重定向目标
          const redirect = `${router.history.location.href}`
          // 跳转到登录页，并传递重定向参数
          router.navigate({ to: '/sign-in', search: { redirect } })
        }
        // 500: 服务器内部错误
        if (error.response?.status === 500) {
          toast.error('服务器内部错误！')
          // 仅在生产环境跳转到错误页面，避免在开发环境干扰 HMR
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
        // 403: 权限不足（当前未实现跳转）
        if (error.response?.status === 403) {
          // TODO: 实现权限不足页面的跳转
          // router.navigate("/forbidden", { replace: true });
        }
      }
    },
  }),
})

/**
 * 创建路由实例
 *
 * 配置路由树、上下文和预加载策略。
 * 路由上下文包含 QueryClient，允许在路由组件中进行数据预加载。
 *
 * @remarks
 * - `routeTree`: 自动生成的路由树
 * - `context`: 路由上下文，包含 QueryClient
 * - `defaultPreload`: 'intent' 表示在鼠标悬停时预加载路由
 * - `defaultPreloadStaleTime`: 0 表示预加载的数据立即过期，需要重新获取
 */
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

/**
 * 注册路由实例以支持类型安全
 *
 * 扩展 TanStack Router 的类型定义，使路由相关的类型推断能够正确工作。
 * 这确保了路由导航、参数、搜索参数等的类型安全。
 */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

/**
 * 应用根元素
 * 从 HTML 中获取根元素，用于挂载 React 应用
 */
const rootElement = document.getElementById('root')!

/**
 * 渲染应用
 *
 * 检查根元素是否已有内容，如果没有则创建 React 根并渲染应用。
 * 使用 StrictMode 启用 React 的严格模式检查。
 *
 * @remarks
 * Provider 嵌套顺序（从外到内）：
 * 1. QueryClientProvider - 提供数据获取和缓存功能
 * 2. ThemeProvider - 提供主题切换功能
 * 3. FontProvider - 提供字体配置功能
 * 4. DirectionProvider - 提供文本方向（LTR/RTL）功能
 * 5. RouterProvider - 提供路由功能
 */
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <FontProvider>
            <DirectionProvider>
              <RouterProvider router={router} />
            </DirectionProvider>
          </FontProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  )
}
