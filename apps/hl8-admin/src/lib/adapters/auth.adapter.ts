/**
 * 前端期望的登录响应格式
 */
import type {
  SignInResponse,
  SignInResponseData,
  RefreshTokenResponse,
} from '../services/auth.service'

/**
 * 认证响应适配器
 * 将后端返回的认证响应格式转换为前端期望的格式
 */

/**
 * 后端登录响应格式（统一响应格式）
 */
interface BackendLoginResponse {
  success: boolean
  data: {
    user: SignInResponseData
    accessToken: string
    refreshToken: string
  }
  meta?: unknown
}

/**
 * 后端刷新令牌响应格式（统一响应格式）
 */
interface BackendRefreshTokenResponse {
  success: boolean
  data: {
    message: string
  }
  meta?: unknown
}

/**
 * 适配后端登录响应为前端期望的格式
 *
 * @param backendResponse - 后端返回的登录响应（统一响应格式）
 * @returns 适配后的前端登录响应
 *
 * @remarks
 * 后端使用 HttpOnly Cookie 存储 Token，前端无需处理 Token
 * 此适配器主要用于兼容性，实际登录逻辑已在 auth.service.ts 中直接处理
 */
export function adaptLoginResponse(
  backendResponse: BackendLoginResponse
): SignInResponse {
  // 后端返回格式：{ success: true, data: { user, accessToken, refreshToken }, meta: {...} }
  // Token 已通过 HttpOnly Cookie 存储，前端只需处理用户数据

  return {
    message: '登录成功',
    data: backendResponse.data.user,
    tokens: {
      access_token: '', // Token 通过 Cookie 管理，前端不存储
      refresh_token: '',
      session_token: '',
      session_refresh_time: new Date().toISOString(),
    },
  }
}

/**
 * 适配后端刷新令牌响应为前端期望的格式
 *
 * @param backendResponse - 后端返回的刷新令牌响应（统一响应格式）
 * @returns 适配后的前端刷新令牌响应
 *
 * @remarks
 * 后端使用 HttpOnly Cookie 存储 Token，Token 已自动更新
 * 此适配器主要用于兼容性，实际刷新逻辑已在 auth.service.ts 中直接处理
 */
export function adaptRefreshTokenResponse(
  backendResponse: BackendRefreshTokenResponse
): RefreshTokenResponse {
  // 后端返回格式：{ success: true, data: { message: string }, meta: {...} }
  // Token 已通过 HttpOnly Cookie 自动更新，前端只需返回消息
  return {
    message: backendResponse.data.message || '令牌刷新成功',
  }
}
