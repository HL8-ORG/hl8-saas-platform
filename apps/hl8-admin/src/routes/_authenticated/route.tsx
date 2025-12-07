import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

/**
 * 认证后的布局路由
 * 为所有需要认证的页面提供统一的布局
 * 当访问 /_authenticated 根路径时，重定向到 /apps
 * 如果用户未登录，重定向到登录页
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    // 检查用户是否已登录
    const { auth } = useAuthStore.getState()
    if (!auth.isAuthenticated()) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
        replace: true,
      })
    }

    // 只有当访问根路径 /_authenticated 时才重定向
    // 子路由（如 /apps, /users 等）不应该被重定向
    if (
      location.pathname === '/_authenticated' ||
      location.pathname === '/_authenticated/'
    ) {
      throw redirect({
        to: '/apps',
        replace: true,
      })
    }
  },
  component: AuthenticatedLayout,
})
