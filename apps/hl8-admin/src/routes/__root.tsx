/**
 * 根路由组件
 *
 * 这是应用的最顶层路由，所有其他路由都是它的子路由。
 * 负责提供全局的布局、错误处理和开发工具。
 *
 * @module routes/__root
 */
import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

/**
 * 根路由上下文类型定义
 *
 * 定义根路由可以访问的上下文数据。
 * 所有子路由都可以通过 `useRouteContext()` 访问这些数据。
 */
interface RootRouteContext {
  /**
   * React Query 客户端实例
   * 用于在路由组件中访问 QueryClient，实现数据预加载等功能
   */
  queryClient: QueryClient
}

/**
 * 创建根路由
 *
 * 使用 `createRootRouteWithContext` 创建带上下文的根路由。
 * 上下文类型通过泛型参数指定，确保类型安全。
 *
 * @returns 根路由配置对象
 */
export const Route = createRootRouteWithContext<RootRouteContext>()({
  /**
   * 根路由组件
   *
   * 渲染应用的全局布局结构：
   * 1. 导航进度条：显示页面切换时的加载状态
   * 2. 路由出口：子路由的内容将在这里渲染
   * 3. Toast 通知：全局消息提示组件
   * 4. 开发工具：仅在开发环境显示，用于调试
   *
   * @returns JSX 元素
   */
  component: () => {
    return (
      <>
        {/* 导航进度条：在路由切换时显示加载进度 */}
        <NavigationProgress />

        {/* 路由出口：所有子路由的内容将在这里渲染 */}
        <Outlet />

        {/* Toast 通知组件：用于显示全局消息提示
            duration: 5000 表示消息显示 5 秒后自动消失 */}
        <Toaster duration={5000} />

        {/* 开发工具：仅在开发环境显示
            - ReactQueryDevtools: 用于调试 React Query 的查询和缓存
            - TanStackRouterDevtools: 用于调试路由状态和导航 */}
        {import.meta.env.MODE === 'development' && (
          <>
            <ReactQueryDevtools buttonPosition='bottom-left' />
            <TanStackRouterDevtools position='bottom-right' />
          </>
        )}
      </>
    )
  },

  /**
   * 404 错误组件
   *
   * 当路由匹配不到任何路径时，将渲染此组件。
   * 用于显示"页面未找到"的错误信息。
   */
  notFoundComponent: NotFoundError,

  /**
   * 通用错误组件
   *
   * 当路由渲染过程中发生未捕获的错误时，将渲染此组件。
   * 用于显示错误信息和错误边界。
   */
  errorComponent: GeneralError,
})
