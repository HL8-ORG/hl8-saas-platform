/**
 * 用户服务
 *
 * 提供用户相关的 API 调用方法，包括：
 * - 获取当前用户信息
 * - 更新用户信息
 * - 获取用户列表（分页）
 *
 * @module lib/services/user.service
 */
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 用户信息响应数据
 */
export interface UserInfoResponseData {
  /**
   * 用户 ID
   */
  userId: string
  /**
   * 用户名
   */
  userName: string
  /**
   * 用户昵称
   */
  nickName: string
  /**
   * 用户头像 URL
   */
  avatar: string | null
  /**
   * 用户邮箱
   */
  email: string | null
  /**
   * 用户手机号
   */
  phoneNumber: string | null
  /**
   * 邮箱是否已验证
   */
  isEmailVerified: boolean
  /**
   * 用户角色列表
   */
  roles: string[]
}

/**
 * 更新用户信息请求数据
 */
export interface UpdateUserInfoRequest {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户名
   */
  username: string
  /**
   * 用户昵称
   */
  nickName: string
  /**
   * 用户头像 URL
   */
  avatar?: string | null
  /**
   * 用户邮箱
   */
  email?: string | null
  /**
   * 用户手机号
   */
  phoneNumber?: string | null
}

/**
 * 后端用户属性（来自后端API）
 *
 * 这是后端 API 返回的用户数据格式。
 * 需要通过适配器转换为前端使用的格式。
 *
 * @remarks
 * - `status`: 后端使用 'ACTIVE'/'INACTIVE'，前端需要转换为 'active'/'inactive'
 * - `domain`: 用户所属的域名/租户
 * - 日期字段为字符串格式，需要转换为 Date 对象
 */
export interface BackendUserProperties {
  /**
   * 用户 ID
   */
  id: string
  /**
   * 用户名
   */
  username: string
  /**
   * 用户所属域名/租户
   */
  domain: string
  /**
   * 用户昵称
   */
  nickName: string
  /**
   * 用户状态（后端格式：ACTIVE/INACTIVE）
   */
  status: 'ACTIVE' | 'INACTIVE'
  /**
   * 用户头像 URL
   */
  avatar: string | null
  /**
   * 用户邮箱
   */
  email: string | null
  /**
   * 用户手机号
   */
  phoneNumber: string | null
  /**
   * 邮箱是否已验证
   */
  isEmailVerified: boolean
  /**
   * 创建时间（ISO 字符串格式）
   */
  createdAt: string
  /**
   * 更新时间（ISO 字符串格式）
   */
  updatedAt: string
}

/**
 * 分页查询参数
 */
export interface PageUsersParams {
  /**
   * 当前页码（从1开始）
   */
  current?: number
  /**
   * 每页大小
   */
  size?: number
  /**
   * 用户名（模糊查询）
   */
  username?: string
  /**
   * 昵称（模糊查询）
   */
  nickName?: string
  /**
   * 状态筛选
   */
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * 分页结果
 */
export interface PaginationResult<T> {
  /**
   * 数据列表
   */
  data: T[]
  /**
   * 总记录数
   */
  total: number
  /**
   * 当前页码
   */
  current: number
  /**
   * 每页大小
   */
  size: number
}

/**
 * 用户列表响应数据（后端使用 records 字段）
 */
export interface UserListResponseData {
  /**
   * 用户列表（后端使用 records）
   */
  records: BackendUserProperties[]
  /**
   * 总记录数
   */
  total: number
  /**
   * 当前页码
   */
  current: number
  /**
   * 每页大小
   */
  size: number
}

/**
 * 用户信息服务
 * 提供获取和更新用户信息等相关的 API 调用
 */
export const userService = {
  /**
   * 获取当前用户信息
   * 获取当前登录用户的完整信息，包括用户 ID、用户名、昵称、头像、邮箱、手机号、邮箱验证状态和角色列表
   * 使用 `/auth/me` 接口，符合 RESTful 规范
   *
   * @returns Promise，解析为用户信息响应
   *
   * @remarks
   * 该接口需要用户已通过认证，后端从 HttpOnly Cookie 中自动获取认证令牌
   *
   * @example
   * ```ts
   * const userInfo = await userService.getUserInfo()
   * // 返回: {
   * //   userId: "user-id",
   * //   userName: "username",
   * //   nickName: "昵称",
   * //   avatar: "https://example.com/avatar.jpg",
   * //   email: "user@example.com",
   * //   phoneNumber: "13800138000",
   * //   isEmailVerified: true,
   * //   roles: ["role1", "role2"]
   * // }
   * ```
   */
  async getUserInfo(): Promise<ApiResponse<UserInfoResponseData>> {
    const response = await apiClient.get<{
      code: number
      message: string
      data: UserInfoResponseData
    }>('/auth/me', {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: UserInfoResponseData }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<UserInfoResponseData>
  },

  /**
   * 更新用户信息
   * 更新当前登录用户的信息，包括昵称、头像、邮箱、手机号等
   *
   * @param data - 用户更新数据，包含用户 ID、用户名和要更新的字段
   * @returns Promise，解析为响应消息
   *
   * @remarks
   * 该接口需要用户已通过认证，只能更新自己的信息
   * 用户名、密码和域不允许通过此接口修改
   *
   * @example
   * ```ts
   * await userService.updateUserInfo({
   *   id: "user-id",
   *   username: "username",
   *   nickName: "新昵称",
   *   avatar: "https://example.com/avatar.jpg",
   *   email: "newemail@example.com",
   *   phoneNumber: "13800138000"
   * })
   * ```
   */
  async updateUserInfo(
    data: UpdateUserInfoRequest
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.put<{
      code: number
      message: string
      data: null
    }>('/user', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 获取用户列表（分页）
   * 根据查询条件分页获取用户列表，支持按用户名、昵称和状态筛选
   *
   * @param params - 分页查询参数，包含页码、页大小、用户名、昵称、状态等筛选条件
   * @returns Promise，解析为分页结果
   *
   * @example
   * ```ts
   * const result = await userService.getUserList({
   *   current: 1,
   *   size: 10,
   *   username: 'test',
   *   status: 'ACTIVE'
   * })
   * ```
   */
  async getUserList(
    params?: PageUsersParams
  ): Promise<ApiResponse<UserListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.username) {
      queryParams.append('username', params.username)
    }
    if (params?.nickName) {
      queryParams.append('nickName', params.nickName)
    }
    if (params?.status) {
      queryParams.append('status', params.status)
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: {
        records: BackendUserProperties[]
        total: number
        current: number
        size: number
      }
    }>(`/user?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    // 后端返回格式：{ code, message, data: { records, total, current, size } }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<UserListResponseData>
  },
}
