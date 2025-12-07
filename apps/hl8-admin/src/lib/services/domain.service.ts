import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 后端域属性（来自后端API）
 */
export interface BackendDomainProperties {
  /**
   * 域 ID
   */
  id: string
  /**
   * 域代码
   */
  code: string
  /**
   * 域名称
   */
  name: string
  /**
   * 域描述
   */
  description: string | null
  /**
   * 域状态
   */
  status: 'ENABLED' | 'DISABLED'
  /**
   * 创建时间
   */
  createdAt: string
  /**
   * 更新时间
   */
  updatedAt: string
}

/**
 * 分页查询参数
 */
export interface PageDomainsParams {
  /**
   * 当前页码（从1开始）
   */
  current?: number
  /**
   * 每页大小
   */
  size?: number
  /**
   * 域名称（模糊查询）
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
 * 域列表响应数据（后端使用 records 字段）
 */
export interface DomainListResponseData {
  /**
   * 域列表（后端使用 records）
   */
  records: BackendDomainProperties[]
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
 * 创建域请求数据
 */
export interface CreateDomainRequest {
  /**
   * 域代码
   */
  code: string
  /**
   * 域名称
   */
  name: string
  /**
   * 域描述
   */
  description?: string | null
}

/**
 * 更新域请求数据
 */
export interface UpdateDomainRequest {
  /**
   * 域 ID
   */
  id: string
  /**
   * 域代码
   */
  code: string
  /**
   * 域名称
   */
  name: string
  /**
   * 域描述
   */
  description?: string | null
}

/**
 * 域信息服务
 * 提供域相关的 API 调用，包括分页查询、创建、更新和删除
 */
export const domainService = {
  /**
   * 获取域列表（分页）
   * 根据查询条件分页获取域列表，支持按名称和状态筛选
   *
   * @param params - 分页查询参数，包含页码、页大小、名称、状态等筛选条件
   * @returns Promise，解析为分页结果
   *
   * @example
   * ```ts
   * const result = await domainService.getDomainList({
   *   current: 1,
   *   size: 10,
   *   name: 'test',
   *   status: 'ACTIVE'
   * })
   * ```
   */
  async getDomainList(
    params?: PageDomainsParams
  ): Promise<ApiResponse<DomainListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
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
        records: BackendDomainProperties[]
        total: number
        current: number
        size: number
      }
    }>(`/domain?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    // 后端返回格式：{ code, message, data: { records, total, current, size } }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<DomainListResponseData>
  },

  /**
   * 创建域
   * 创建一个新的 Casbin 域
   *
   * @param data - 域创建数据，包含域代码、名称、描述等信息
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await domainService.createDomain({
   *   code: 'domain001',
   *   name: '测试域',
   *   description: '这是一个测试域'
   * })
   * ```
   */
  async createDomain(data: CreateDomainRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/domain', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 更新域
   * 更新指定域的信息
   *
   * @param data - 域更新数据，包含域 ID 和要更新的字段
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await domainService.updateDomain({
   *   id: 'domain-id-123',
   *   code: 'domain001',
   *   name: '更新后的域名称',
   *   description: '更新后的描述'
   * })
   * ```
   */
  async updateDomain(data: UpdateDomainRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.put<{
      code: number
      message: string
      data: null
    }>('/domain', data, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除域
   * 删除指定的域
   *
   * @param id - 要删除的域 ID
   * @returns Promise，解析为响应消息
   *
   * @example
   * ```ts
   * await domainService.deleteDomain('domain-id-123')
   * ```
   */
  async deleteDomain(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/domain/${id}`, {
      skipDataExtraction: true,
    })
    // 后端返回格式：{ code, message, data: null }
    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },
}
