import { create } from 'zustand'
import type { SignInResponseData } from '@/lib/services/auth.service'

/**
 * 认证用户接口
 * 匹配后端 User 实体的数据结构（排除敏感字段）
 */
export interface AuthUser extends SignInResponseData {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户邮箱
   */
  email: string
  /**
   * 用户名
   */
  username: string
  /**
   * 用户昵称
   */
  nickName?: string
  /**
   * 用户头像 URL
   */
  avatar?: string | null
  /**
   * 邮箱是否已验证
   */
  isEmailVerified: boolean
  /**
   * 邮箱验证时间
   */
  emailVerifiedAt?: string
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
  /**
   * 个人资料（如果存在）
   */
  profile?: unknown
}

/**
 * 认证状态接口
 */
interface AuthState {
  auth: {
    /**
     * 当前登录用户
     */
    user: AuthUser | null
    /**
     * 访问令牌
     */
    accessToken: string
    /**
     * 刷新令牌
     */
    refreshToken: string
    /**
     * 会话令牌
     */
    sessionToken: string
    /**
     * 设置用户数据
     */
    setUser: (user: AuthUser | null) => void
    /**
     * 设置访问令牌
     */
    setAccessToken: (token: string) => void
    /**
     * 设置刷新令牌
     */
    setRefreshToken: (token: string) => void
    /**
     * 设置会话令牌
     */
    setSessionToken: (token: string) => void
    /**
     * 设置所有令牌
     */
    setTokens: (tokens: {
      access_token: string
      refresh_token: string
      session_token: string
    }) => void
    /**
     * 清除访问令牌
     */
    resetAccessToken: () => void
    /**
     * 清除所有认证数据
     */
    reset: () => void
    /**
     * 检查是否已登录
     */
    isAuthenticated: () => boolean
  }
}

/**
 * 认证状态管理 Store
 * 使用 Zustand 管理用户认证状态
 *
 * @remarks
 * 后端使用 HttpOnly Cookie 存储 Token，前端 JavaScript 无法直接读取。
 * 因此，前端只管理用户数据状态，Token 的存储和传输完全由后端自动处理。
 * 所有需要认证的请求都会自动携带 Cookie，无需手动设置 Authorization header。
 */
export const useAuthStore = create<AuthState>()((set, get) => {
  // 初始化状态：不再从 Cookie 读取 Token（后端使用 HttpOnly Cookie）
  // 用户数据可以通过调用 /auth/me 接口获取

  return {
    auth: {
      user: null,
      accessToken: '',
      refreshToken: '',
      sessionToken: '',

      /**
       * 设置用户数据
       * 用户数据存储在内存中，不写入 Cookie（后端使用 HttpOnly Cookie 管理 Token）
       */
      setUser: (user) => {
        set((state) => ({ ...state, auth: { ...state.auth, user } }))
      },

      /**
       * 设置访问令牌
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅用于状态同步（如果需要）
       * 实际 Token 的存储和传输由后端自动处理
       */
      setAccessToken: (token) => {
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: token },
        }))
      },

      /**
       * 设置刷新令牌
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅用于状态同步（如果需要）
       * 实际 Token 的存储和传输由后端自动处理
       */
      setRefreshToken: (token) => {
        set((state) => ({
          ...state,
          auth: { ...state.auth, refreshToken: token },
        }))
      },

      /**
       * 设置会话令牌
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅用于状态同步（如果需要）
       * 实际 Token 的存储和传输由后端自动处理
       */
      setSessionToken: (token) => {
        set((state) => ({
          ...state,
          auth: { ...state.auth, sessionToken: token },
        }))
      },

      /**
       * 设置所有令牌
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅用于状态同步（如果需要）
       * 实际 Token 的存储和传输由后端自动处理
       */
      setTokens: (tokens) => {
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            sessionToken: tokens.session_token,
          },
        }))
      },

      /**
       * 清除访问令牌
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅清除内存中的状态
       * 实际的 Cookie 清除由后端登出接口处理
       */
      resetAccessToken: () => {
        set((state) => ({
          ...state,
          auth: { ...state.auth, accessToken: '' },
        }))
      },

      /**
       * 清除所有认证数据
       * 注意：后端使用 HttpOnly Cookie 存储 Token，此方法仅清除内存中的状态
       * 实际的 Cookie 清除由后端登出接口处理
       */
      reset: () => {
        set((state) => ({
          ...state,
          auth: {
            ...state.auth,
            user: null,
            accessToken: '',
            refreshToken: '',
            sessionToken: '',
          },
        }))
      },

      /**
       * 检查是否已登录
       * 由于后端使用 HttpOnly Cookie，前端无法直接读取 Token
       * 因此只检查用户数据是否存在，Token 的有效性由后端验证
       */
      isAuthenticated: () => {
        const state = get()
        return !!state.auth.user
      },
    },
  }
})
