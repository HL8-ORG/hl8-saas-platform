/**
 * 文本方向提供者组件
 *
 * 管理应用的文本方向（LTR/RTL）切换功能。
 * 支持从左到右（LTR）和从右到左（RTL）两种文本方向。
 *
 * @module context/direction-provider
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { DirectionProvider as RdxDirProvider } from '@radix-ui/react-direction'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

/**
 * 文本方向类型
 * - 'ltr': 从左到右（Left-to-Right）
 * - 'rtl': 从右到左（Right-to-Left）
 */
export type Direction = 'ltr' | 'rtl'

/**
 * 默认文本方向
 */
const DEFAULT_DIRECTION = 'ltr'

/**
 * Cookie 键名，用于持久化文本方向设置
 */
const DIRECTION_COOKIE_NAME = 'dir'

/**
 * Cookie 过期时间（1 年）
 */
const DIRECTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * 文本方向上下文类型
 */
type DirectionContextType = {
  /**
   * 默认文本方向
   */
  defaultDir: Direction
  /**
   * 当前文本方向
   */
  dir: Direction
  /**
   * 设置文本方向
   */
  setDir: (dir: Direction) => void
  /**
   * 重置文本方向为默认值
   */
  resetDir: () => void
}

/**
 * 文本方向上下文
 */
const DirectionContext = createContext<DirectionContextType | null>(null)

/**
 * 文本方向提供者组件
 *
 * 提供文本方向切换功能，支持 LTR 和 RTL 两种方向。
 * 文本方向设置会持久化到 Cookie 中，并应用到 HTML 元素。
 *
 * @param props - 组件属性
 * @param props.children - 子组件
 * @returns JSX 元素
 *
 * @remarks
 * - 从 Cookie 读取保存的文本方向设置
 * - 将文本方向应用到 document.documentElement 的 dir 属性
 * - 使用 Radix UI 的 DirectionProvider 确保组件库正确支持 RTL
 */
export function DirectionProvider({ children }: { children: React.ReactNode }) {
  /**
   * 当前文本方向状态
   * 从 Cookie 读取保存的文本方向，如果没有则使用默认值
   */
  const [dir, _setDir] = useState<Direction>(
    () => (getCookie(DIRECTION_COOKIE_NAME) as Direction) || DEFAULT_DIRECTION
  )

  /**
   * 应用文本方向到 HTML 元素
   * 当文本方向变化时，更新 document.documentElement 的 dir 属性
   */
  useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.setAttribute('dir', dir)
  }, [dir])

  /**
   * 设置文本方向
   * 保存到 Cookie 并更新状态
   *
   * @param dir - 要设置的文本方向
   */
  const setDir = (dir: Direction) => {
    // 更新状态
    _setDir(dir)
    // 保存到 Cookie
    setCookie(DIRECTION_COOKIE_NAME, dir, DIRECTION_COOKIE_MAX_AGE)
  }

  /**
   * 重置文本方向为默认值
   * 清除 Cookie 并恢复默认方向
   */
  const resetDir = () => {
    // 恢复默认方向
    _setDir(DEFAULT_DIRECTION)
    // 清除 Cookie
    removeCookie(DIRECTION_COOKIE_NAME)
  }

  return (
    <DirectionContext
      value={{
        defaultDir: DEFAULT_DIRECTION,
        dir,
        setDir,
        resetDir,
      }}
    >
      {/* 使用 Radix UI 的 DirectionProvider 确保组件库正确支持 RTL */}
      <RdxDirProvider dir={dir}>{children}</RdxDirProvider>
    </DirectionContext>
  )
}

/**
 * 使用文本方向的 Hook
 *
 * 从 DirectionProvider 中获取文本方向相关的状态和方法。
 *
 * @returns 文本方向状态和方法
 * @throws 如果不在 DirectionProvider 中使用，抛出错误
 *
 * @example
 * ```tsx
 * const { dir, setDir } = useDirection()
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDirection() {
  const context = useContext(DirectionContext)
  if (!context) {
    throw new Error('useDirection must be used within a DirectionProvider')
  }
  return context
}
