/**
 * 主题提供者组件
 *
 * 管理应用的深色/浅色主题切换功能。
 * 支持系统主题检测、手动切换和主题持久化。
 *
 * @module context/theme-provider
 */
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

/**
 * 主题类型
 * - 'dark': 深色主题
 * - 'light': 浅色主题
 * - 'system': 跟随系统设置
 */
type Theme = 'dark' | 'light' | 'system'

/**
 * 已解析的主题类型（排除 'system'）
 * 这是实际应用到页面的主题
 */
type ResolvedTheme = Exclude<Theme, 'system'>

/**
 * 默认主题
 */
const DEFAULT_THEME = 'system'

/**
 * Cookie 键名，用于持久化主题设置
 */
const THEME_COOKIE_NAME = 'vite-ui-theme'

/**
 * Cookie 过期时间（1 年）
 */
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * 主题提供者组件的属性
 */
type ThemeProviderProps = {
  /**
   * 子组件
   */
  children: React.ReactNode
  /**
   * 默认主题（可选）
   */
  defaultTheme?: Theme
  /**
   * 存储键名（可选，用于自定义 Cookie 键名）
   */
  storageKey?: string
}

/**
 * 主题提供者的状态类型
 */
type ThemeProviderState = {
  /**
   * 默认主题
   */
  defaultTheme: Theme
  /**
   * 已解析的主题（实际应用的主题）
   */
  resolvedTheme: ResolvedTheme
  /**
   * 当前主题设置
   */
  theme: Theme
  /**
   * 设置主题
   */
  setTheme: (theme: Theme) => void
  /**
   * 重置主题为默认值
   */
  resetTheme: () => void
}

/**
 * 初始状态
 */
const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  resolvedTheme: 'light',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  resetTheme: () => null,
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeProviderState>(initialState)

/**
 * 主题提供者组件
 *
 * 提供主题切换功能，支持深色、浅色和系统主题。
 * 主题设置会持久化到 Cookie 中。
 *
 * @param props - 组件属性
 * @returns JSX 元素
 *
 * @remarks
 * - 从 Cookie 读取保存的主题设置
 * - 当主题为 'system' 时，自动检测系统偏好
 * - 监听系统主题变化，自动更新
 * - 将主题类名应用到 document.documentElement
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_COOKIE_NAME,
  ...props
}: ThemeProviderProps) {
  /**
   * 当前主题状态
   * 从 Cookie 读取保存的主题，如果没有则使用默认主题
   */
  const [theme, _setTheme] = useState<Theme>(
    () => (getCookie(storageKey) as Theme) || defaultTheme
  )

  /**
   * 已解析的主题（实际应用的主题）
   * 使用 useMemo 优化，避免不必要的重新计算
   *
   * @remarks
   * - 如果主题为 'system'，检测系统偏好
   * - 否则直接使用设置的主题
   */
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  /**
   * 应用主题到 DOM
   * 监听主题变化和系统主题变化
   */
  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    /**
     * 应用主题到根元素
     * 移除旧的主题类，添加新的主题类
     *
     * @param currentResolvedTheme - 要应用的主题
     */
    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      // 移除现有的主题类
      root.classList.remove('light', 'dark')
      // 添加新的主题类
      root.classList.add(currentResolvedTheme)
    }

    /**
     * 处理系统主题变化
     * 当主题设置为 'system' 时，响应系统主题变化
     */
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    // 应用当前主题
    applyTheme(resolvedTheme)

    // 监听系统主题变化
    mediaQuery.addEventListener('change', handleChange)

    // 清理事件监听器
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  /**
   * 设置主题
   * 保存到 Cookie 并更新状态
   *
   * @param theme - 要设置的主题
   */
  const setTheme = (theme: Theme) => {
    // 保存到 Cookie
    setCookie(storageKey, theme, THEME_COOKIE_MAX_AGE)
    // 更新状态
    _setTheme(theme)
  }

  /**
   * 重置主题为默认值
   * 清除 Cookie 并恢复默认主题
   */
  const resetTheme = () => {
    // 清除 Cookie
    removeCookie(storageKey)
    // 恢复默认主题
    _setTheme(DEFAULT_THEME)
  }

  /**
   * 上下文值
   */
  const contextValue = {
    defaultTheme,
    resolvedTheme,
    resetTheme,
    theme,
    setTheme,
  }

  return (
    <ThemeContext value={contextValue} {...props}>
      {children}
    </ThemeContext>
  )
}

/**
 * 使用主题的 Hook
 *
 * 从 ThemeProvider 中获取主题相关的状态和方法。
 *
 * @returns 主题状态和方法
 * @throws 如果不在 ThemeProvider 中使用，抛出错误
 *
 * @example
 * ```tsx
 * const { theme, setTheme, resolvedTheme } = useTheme()
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
