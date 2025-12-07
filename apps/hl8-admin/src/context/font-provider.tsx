/**
 * 字体提供者组件
 *
 * 管理应用的字体切换功能。
 * 支持在多种字体之间切换，字体设置会持久化到 Cookie 中。
 *
 * @module context/font-provider
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { fonts } from '@/config/fonts'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

/**
 * 字体类型
 * 从 fonts 配置数组中推断类型
 */
type Font = (typeof fonts)[number]

/**
 * Cookie 键名，用于持久化字体设置
 */
const FONT_COOKIE_NAME = 'font'

/**
 * Cookie 过期时间（1 年）
 */
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * 字体上下文类型
 */
type FontContextType = {
  /**
   * 当前字体
   */
  font: Font
  /**
   * 设置字体
   */
  setFont: (font: Font) => void
  /**
   * 重置字体为默认值
   */
  resetFont: () => void
}

/**
 * 字体上下文
 */
const FontContext = createContext<FontContextType | null>(null)

/**
 * 字体提供者组件
 *
 * 提供字体切换功能，支持在多种字体之间切换。
 * 字体设置会持久化到 Cookie 中，并应用到 HTML 根元素。
 *
 * @param props - 组件属性
 * @param props.children - 子组件
 * @returns JSX 元素
 *
 * @remarks
 * - 从 Cookie 读取保存的字体设置
 * - 验证字体是否在允许的字体列表中
 * - 将字体类名应用到 document.documentElement
 * - 移除旧的字体类，添加新的字体类
 */
export function FontProvider({ children }: { children: React.ReactNode }) {
  /**
   * 当前字体状态
   * 从 Cookie 读取保存的字体，验证后使用，如果无效则使用默认字体（第一个）
   */
  const [font, _setFont] = useState<Font>(() => {
    const savedFont = getCookie(FONT_COOKIE_NAME)
    // 验证字体是否在允许的字体列表中
    return fonts.includes(savedFont as Font) ? (savedFont as Font) : fonts[0]
  })

  /**
   * 应用字体到 HTML 根元素
   * 当字体变化时，更新 document.documentElement 的类名
   */
  useEffect(() => {
    /**
     * 应用字体类名
     * 移除所有以 'font-' 开头的类，然后添加新的字体类
     *
     * @param font - 要应用的字体名称
     */
    const applyFont = (font: string) => {
      const root = document.documentElement
      // 移除所有现有的字体类
      root.classList.forEach((cls) => {
        if (cls.startsWith('font-')) root.classList.remove(cls)
      })
      // 添加新的字体类
      root.classList.add(`font-${font}`)
    }

    applyFont(font)
  }, [font])

  /**
   * 设置字体
   * 保存到 Cookie 并更新状态
   *
   * @param font - 要设置的字体
   */
  const setFont = (font: Font) => {
    // 保存到 Cookie
    setCookie(FONT_COOKIE_NAME, font, FONT_COOKIE_MAX_AGE)
    // 更新状态
    _setFont(font)
  }

  /**
   * 重置字体为默认值
   * 清除 Cookie 并恢复默认字体（第一个字体）
   */
  const resetFont = () => {
    // 清除 Cookie
    removeCookie(FONT_COOKIE_NAME)
    // 恢复默认字体
    _setFont(fonts[0])
  }

  return (
    <FontContext value={{ font, setFont, resetFont }}>{children}</FontContext>
  )
}

/**
 * 使用字体的 Hook
 *
 * 从 FontProvider 中获取字体相关的状态和方法。
 *
 * @returns 字体状态和方法
 * @throws 如果不在 FontProvider 中使用，抛出错误
 *
 * @example
 * ```tsx
 * const { font, setFont } = useFont()
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useFont = () => {
  const context = useContext(FontContext)
  if (!context) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}
