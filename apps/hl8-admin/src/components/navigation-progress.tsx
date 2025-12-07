/**
 * 导航进度条组件
 *
 * 在路由切换时显示页面加载进度，提升用户体验。
 * 使用 react-top-loading-bar 实现，根据路由状态自动显示/隐藏。
 *
 * @module components/navigation-progress
 */
import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar'

/**
 * 导航进度条组件
 *
 * 监听路由状态变化，当路由处于加载状态（pending）时显示进度条，
 * 加载完成后自动隐藏。
 *
 * @returns JSX 元素
 *
 * @remarks
 * - 使用 `useRouterState` 监听路由状态
 * - 当 `status === 'pending'` 时启动进度条
 * - 当路由加载完成时自动完成进度条
 * - 进度条颜色使用 CSS 变量 `--muted-foreground`，支持主题切换
 * - 高度设置为 2px，带阴影效果
 *
 * @example
 * ```tsx
 * // 在根路由中使用
 * <NavigationProgress />
 * ```
 */
export function NavigationProgress() {
  /**
   * LoadingBar 组件的引用
   * 用于控制进度条的显示和隐藏
   */
  const ref = useRef<LoadingBarRef>(null)

  /**
   * 获取当前路由状态
   * 用于判断路由是否正在加载
   */
  const state = useRouterState()

  /**
   * 监听路由状态变化
   * 根据路由状态控制进度条的显示
   */
  useEffect(() => {
    if (state.status === 'pending') {
      // 路由正在加载，启动进度条
      ref.current?.continuousStart()
    } else {
      // 路由加载完成，完成进度条
      ref.current?.complete()
    }
  }, [state.status])

  return (
    <LoadingBar
      color='var(--muted-foreground)'
      ref={ref}
      shadow={true}
      height={2}
    />
  )
}
