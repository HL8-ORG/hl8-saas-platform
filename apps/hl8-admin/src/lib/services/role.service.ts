/**
 * 角色服务
 *
 * 提供角色相关的 API 调用方法，包括：
 * - 获取角色列表（分页）
 * - 创建角色
 * - 更新角色
 * - 删除角色
 *
 * @module lib/services/role.service
 */
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 后端角色属性（来自后端API）
 */
export interface BackendRoleProperties {
  /**
   * 角色 ID
   */
  id: string
  /**
   * 角色代码
   */
  code: string
  /**
   * 角色名称
   */
  name: string
  /**
   * 父角色 ID
   */
  pid: string
  /**
   * 角色状态
   */
  status: 'ENABLED' | 'DISABLED'
  /**
   * 角色描述
   */
  description: string | null
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string | null
}

/**
 * 分页查询参数
 */
export interface PageRolesParams {
  /**
   * 当前页码（从1开始）
   */
  current?: number
  /**
   * 每页大小
   */
  size?: number
  /**
   * 角色代码（模糊查询）
   */
  code?: string
  /**
   * 角色名称（模糊查询）
   */
  name?: string
  /**
   * 状态筛选
   */
  status?: 'ENABLED' | 'DISABLED'
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
 * 角色列表响应数据（后端使用 records 字段）
 */
export interface RoleListResponseData {
  /**
   * 角色列表（后端使用 records）
   */
  records: BackendRoleProperties[]
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
 * 创建角色请求数据
 */
export interface CreateRoleRequest {
  /**
   * 角色代码
   */
  code: string
  /**
   * 角色名称
   */
  name: string
  /**
   * 父角色 ID
   */
  pid: string
  /**
   * 角色状态
   */
  status: 'ENABLED' | 'DISABLED'
  /**
   * 角色描述
   */
  description?: string | null
}

/**
 * 更新角色请求数据
 */
export interface UpdateRoleRequest {
  /**
   * 角色 ID
   */
  id: string
  /**
   * 角色代码
   */
  code: string
  /**
   * 角色名称
   */
  name: string
  /**
   * 父角色 ID
   */
  pid: string
  /**
   * 角色状态
   */
  status: 'ENABLED' | 'DISABLED'
  /**
   * 角色描述
   */
  description?: string | null
}

/**
 * 角色信息服务
 * 提供角色相关的 API 调用，包括分页查询、创建、更新和删除
 */
export const roleService = {
  /**
   * 获取角色列表（分页）
   * 根据查询条件分页获取角色列表，支持按代码、名称和状态筛选
   *
   * @param params - 分页查询参数，包含页码、页大小、代码、名称、状态等筛选条件
   * @returns Promise，解析为分页结果
   *
   * @example
   * ```ts
   * const result = await roleService.getRoleList({
   *   current: 1,
   *   size: 10,
   *   code: 'admin',
   *   name: '管理员',
   *   status: 'ENABLED'
   * })
   * ```
   */
  async getRoleList(
    params?: PageRolesParams
  ): Promise<ApiResponse<RoleListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.code) {
      queryParams.append('code', params.code)
    }
    if (params?.name) {
      queryParams.append('name', params.name)
    }
    if (params?.status) {
      queryParams.append('status', params.status)
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: {
        records: BackendRoleProperties[]
        total: number
        current: number
        size: number
      }
    }>(`/role?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    // 后端返回格式：{ code, message, data: { records, total, current, size } }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<RoleListResponseData>
  },

  /**
   * 创建角色
   * 创建一个新的角色
   *
   * @param data - 角色创建数据，包含角色代码、名称、父角色、状态、描述等信息
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await roleService.createRole({
   *   code: 'admin',
   *   name: '管理员',
   *   pid: '',
   *   status: 'ENABLED',
   *   description: '系统管理员角色'
   * })
   * ```
   */
  async createRole(data: CreateRoleRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/role', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 更新角色
   * 更新指定角色的信息
   *
   * @param data - 角色更新数据，包含角色 ID 和要更新的字段
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await roleService.updateRole({
   *   id: 'role-id-123',
   *   code: 'admin',
   *   name: '更新后的角色名称',
   *   pid: '',
   *   status: 'ENABLED',
   *   description: '更新后的描述'
   * })
   * ```
   */
  async updateRole(data: UpdateRoleRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.put<{
      code: number
      message: string
      data: null
    }>('/role', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除角色
   * 删除指定的角色
   *
   * @param id - 要删除的角色 ID
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await roleService.deleteRole('role-id-123')
   * ```
   */
  async deleteRole(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/role/${id}`, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },
}
