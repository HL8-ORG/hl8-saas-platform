import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 用户注册请求参数
 */
export interface RegisterRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 邮箱确认请求参数
 */
export interface ConfirmEmailRequest {
  /**
   * 用户邮箱地址
   */
  email: string
  /**
   * OTP 验证码（6 位数字）
   */
  token: string
}

/**
 * 用户登录请求参数
 */
export interface SignInRequest {
  /**
   * 用户标识符（邮箱或用户名）
   * 注意：后端期望字段名为 email，前端使用 identifier 作为内部字段名
   */
  identifier: string
  /**
   * 用户密码
   */
  password: string
}

/**
 * 刷新令牌请求参数
 * 已废弃：后端从 HttpOnly Cookie 中自动读取 refreshToken，无需传递参数
 *
 * @deprecated 使用无参数的 refreshToken() 方法
 */
export interface RefreshTokenRequest {
  /**
   * 刷新令牌字符串
   */
  refreshToken: string
}

/**
 * 用户登出请求参数
 * 已废弃：后端从 HttpOnly Cookie 中自动读取 refreshToken，无需传递参数
 *
 * @deprecated 使用无参数的 signOut() 方法
 */
export interface SignOutRequest {
  /**
   * 刷新令牌
   *
   * @description 用于标识要退出的会话的刷新令牌
   */
  refreshToken: string
}

/**
 * 登录响应数据
 */
export interface SignInResponseData {
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
 * 登录响应（包含令牌）
 */
export interface SignInResponse {
  /**
   * 响应消息
   */
  message: string
  /**
   * 用户数据
   */
  data: SignInResponseData
  /**
   * 认证令牌
   */
  tokens: {
    /**
     * 访问令牌
     */
    access_token: string
    /**
     * 刷新令牌
     */
    refresh_token: string
    /**
     * 会话令牌
     */
    session_token: string
    /**
     * 访问令牌刷新时间
     */
    session_refresh_time: string
  }
}

/**
 * 刷新令牌响应
 * 后端只返回成功消息，Token 已通过 HttpOnly Cookie 自动更新
 */
export interface RefreshTokenResponse {
  /**
   * 响应消息
   */
  message: string
}

/**
 * 认证服务
 * 提供用户注册、登录、邮箱确认、令牌刷新、登出等认证相关的 API 调用
 */
export const authService = {
  /**
   * 用户注册
   * 创建新用户账户，后端会发送验证码到注册邮箱
   *
   * @param data - 注册数据（邮箱和密码）
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.register({
   *   email: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async register(data: RegisterRequest): Promise<ApiResponse> {
    const response = await apiClient.post<ApiResponse>(
      '/auth/signup',
      {
        email: data.email,
        password: data.password,
        // 后端要求 fullName 字段，至少 2 个字符
        // 使用邮箱作为默认的 fullName（不需要在 UI 中显示输入框）
        fullName: data.email,
      },
      {
        skipDataExtraction: true,
      }
    )
    return response.data as ApiResponse
  },

  /**
   * 验证邮箱（OTP 验证）
   * 使用 OTP 验证码验证用户邮箱，验证成功后更新用户状态
   *
   * @param data - 邮箱验证数据（邮箱和验证码）
   * @returns Promise，解析为验证响应（包含用户信息）
   *
   * @example
   * ```ts
   * const response = await authService.verifyEmail({
   *   email: 'user@example.com',
   *   code: '123456'
   * })
   * ```
   */
  async verifyEmail(data: ConfirmEmailRequest): Promise<{
    message: string
    user: {
      id: string
      email: string
      fullName: string
      role: string
      isEmailVerified: boolean
    }
  }> {
    const response = await apiClient.post<{
      success: boolean
      data: {
        message: string
        user: {
          id: string
          email: string
          fullName: string
          role: string
          isEmailVerified: boolean
        }
      }
      meta?: unknown
    }>(
      '/auth/verify-email',
      {
        email: data.email,
        code: data.token, // 前端使用 token，后端使用 code
      },
      {
        skipDataExtraction: true,
      }
    )
    return response.data.data
  },

  /**
   * 用户登录
   * 验证用户凭据，生成访问令牌和刷新令牌
   * 后端使用 HttpOnly Cookie 存储 Token，前端无需手动管理
   *
   * @param data - 登录数据（标识符和密码）
   * @returns Promise，解析为登录响应（包含用户数据）
   *
   * @remarks
   * identifier 可以是邮箱或用户名
   * 设备信息会自动通过请求拦截器添加
   * Token 由后端自动存储在 HttpOnly Cookie 中，前端无需处理
   *
   * @example
   * ```ts
   * const response = await authService.signIn({
   *   identifier: 'user@example.com',
   *   password: 'password123'
   * })
   * ```
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    // 后端期望字段名为 email，而不是 identifier
    // 将 identifier 转换为 email 发送给后端
    const response = await apiClient.post<{
      success: boolean
      data: {
        user: SignInResponseData
        accessToken: string
        refreshToken: string
      }
      meta?: unknown
    }>(
      '/auth/login',
      {
        email: data.identifier, // 将 identifier 映射为 email
        password: data.password,
      },
      {
        skipDataExtraction: true,
      }
    )

    // 后端返回格式：{ success: true, data: { user, accessToken, refreshToken }, meta: {...} }
    // Token 已通过 HttpOnly Cookie 存储，前端只需处理用户数据
    // 后端返回的 user 格式：{ id, email, fullName, role, isEmailVerified }
    // 需要适配为前端期望的 SignInResponseData 格式

    const backendUser = response.data.data.user as unknown as {
      id: string
      email: string
      fullName: string
      role: string
      isEmailVerified?: boolean
    }
    const userData: SignInResponseData = {
      id: backendUser.id,
      email: backendUser.email || '',
      username: backendUser.fullName || backendUser.email || '', // 使用 fullName 或 email 作为 username
      nickName: backendUser.fullName || undefined,
      avatar: null,
      isEmailVerified: backendUser.isEmailVerified ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 返回登录响应（不包含 Token，因为 Token 通过 Cookie 管理）
    return {
      message: '登录成功',
      data: userData,
      tokens: {
        access_token: '', // Token 通过 Cookie 管理，前端不存储
        refresh_token: '',
        session_token: '',
        session_refresh_time: new Date().toISOString(),
      },
    }
  },

  /**
   * 刷新访问令牌
   * 使用刷新令牌生成新的访问令牌和刷新令牌对
   * 后端从 HttpOnly Cookie 中自动读取 refreshToken，无需在请求体中传递
   *
   * @returns Promise，解析为刷新令牌响应
   *
   * @example
   * ```ts
   * const response = await authService.refreshToken()
   * ```
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<{
      success: boolean
      data: { message: string }
      meta?: unknown
    }>(
      '/auth/refresh',
      {},
      {
        skipDataExtraction: true,
      }
    )

    // 后端返回格式：{ success: true, data: { message: string }, meta: {...} }
    // Token 已通过 HttpOnly Cookie 自动更新，前端只需返回消息
    return {
      message: response.data.data.message || '令牌刷新成功',
    }
  },

  /**
   * 用户登出
   * 删除当前设备的会话记录
   * 后端从 HttpOnly Cookie 中自动读取 refreshToken，无需在请求体中传递
   *
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.signOut()
   * ```
   */
  async signOut(): Promise<ApiResponse> {
    const response = await apiClient.post<{
      success: boolean
      data: { message: string }
      meta?: unknown
    }>(
      '/auth/logout',
      {},
      {
        skipDataExtraction: true,
      }
    )
    // 后端返回格式：{ success: true, data: { message: string }, meta: {...} }
    // Cookie 已由后端自动清除
    return {
      message: response.data.data.message || '登出成功',
      data: response.data.data,
    } as ApiResponse
  },

  /**
   * 重新发送验证邮件
   * 为未验证的用户重新生成验证码并发送验证邮件
   *
   * @param email - 用户邮箱地址
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await authService.resendConfirmationEmail('user@example.com')
   * ```
   */
  async resendConfirmationEmail(email: string): Promise<ApiResponse> {
    const response = await apiClient.post<{
      success: boolean
      data: { message: string }
      meta?: unknown
    }>(
      '/auth/resend-verification',
      { email },
      {
        skipDataExtraction: true,
      }
    )
    // 后端返回格式：{ success: true, data: { message: string }, meta: {...} }
    // 需要转换为 ApiResponse 格式：{ message: string, data: {...} }
    return {
      message: response.data.data.message || '验证邮件已重新发送',
      data: response.data.data,
    } as ApiResponse
  },
}
