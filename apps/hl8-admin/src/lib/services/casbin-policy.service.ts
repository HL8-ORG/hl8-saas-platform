/**
 * Casbin 策略服务
 *
 * 提供 Casbin 策略相关的 API 调用方法，包括：
 * - 获取策略规则列表（分页）
 * - 创建策略规则
 * - 删除策略规则
 * - 批量操作策略规则
 * - 获取角色继承关系列表（分页）
 * - 创建角色继承关系
 * - 删除角色继承关系
 *
 * @module lib/services/casbin-policy.service
 */
import { apiClient } from '../api-client'
import type { ApiResponse } from '../api-client.types'

/**
 * 后端策略规则属性（来自后端API）
 */
export interface BackendPolicyRuleProperties {
  id: number
  ptype: 'p' | 'g'
  v0?: string
  v1?: string
  v2?: string
  v3?: string
  v4?: string
  v5?: string
}

/**
 * 后端策略规则 DTO（来自后端API）
 */
export interface BackendPolicyRuleDto {
  id: number
  ptype: 'p' | 'g'
  subject?: string
  object?: string
  action?: string
  domain?: string
  effect?: string
  v4?: string
  v5?: string
}

/**
 * 后端角色继承关系 DTO（来自后端API）
 */
export interface BackendRoleRelationDto {
  id: number
  childSubject: string
  parentRole: string
  domain?: string
}

/**
 * 分页查询参数
 */
export interface PagePoliciesParams {
  current?: number
  size?: number
  ptype?: 'p' | 'g'
  subject?: string
  object?: string
  action?: string
  domain?: string
}

/**
 * 分页查询角色关系参数
 */
export interface PageRelationsParams {
  current?: number
  size?: number
  childSubject?: string
  parentRole?: string
  domain?: string
}

/**
 * 分页结果
 */
export interface PaginationResult<T> {
  data: T[]
  total: number
  current: number
  size: number
}

/**
 * 策略规则列表响应数据
 */
export interface PolicyListResponseData {
  data: BackendPolicyRuleDto[]
  total: number
  current: number
  size: number
}

/**
 * 角色继承关系列表响应数据
 */
export interface RelationListResponseData {
  data: BackendRoleRelationDto[]
  total: number
  current: number
  size: number
}

/**
 * 创建策略规则请求参数
 */
export interface CreatePolicyRequest {
  ptype: 'p' | 'g'
  subject?: string
  object?: string
  action?: string
  domain?: string
  effect?: string
  v4?: string
  v5?: string
}

/**
 * 批量操作策略规则请求参数
 */
export interface BatchPolicyRequest {
  policies: CreatePolicyRequest[]
  operation: 'add' | 'delete'
}

/**
 * 创建角色继承关系请求参数
 */
export interface CreateRelationRequest {
  childSubject: string
  parentRole: string
  domain?: string
}

/**
 * Casbin 策略服务
 */
export const casbinPolicyService = {
  /**
   * 获取策略规则列表（分页）
   *
   * @param params - 分页查询参数
   * @returns 分页结果
   */
  async getPolicyList(
    params?: PagePoliciesParams
  ): Promise<ApiResponse<PolicyListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.ptype) {
      queryParams.append('ptype', params.ptype)
    }
    if (params?.subject) {
      queryParams.append('subject', params.subject)
    }
    if (params?.object) {
      queryParams.append('object', params.object)
    }
    if (params?.action) {
      queryParams.append('action', params.action)
    }
    if (params?.domain) {
      queryParams.append('domain', params.domain)
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: PolicyListResponseData
    }>(`/casbin/policies?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<PolicyListResponseData>
  },

  /**
   * 创建策略规则
   *
   * @param data - 策略规则创建数据
   * @returns 操作结果
   */
  async createPolicy(data: CreatePolicyRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/casbin/policies', data, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除策略规则
   *
   * @param id - 策略规则 ID
   * @returns 操作结果
   */
  async deletePolicy(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/casbin/policies/${id}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 批量操作策略规则
   *
   * @param data - 批量操作数据
   * @returns 操作结果
   */
  async batchPolicies(data: BatchPolicyRequest): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/casbin/policies/batch', data, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 获取角色继承关系列表（分页）
   *
   * @param params - 分页查询参数
   * @returns 分页结果
   */
  async getRelationList(
    params?: PageRelationsParams
  ): Promise<ApiResponse<RelationListResponseData>> {
    const queryParams = new URLSearchParams()
    if (params?.current) {
      queryParams.append('current', params.current.toString())
    }
    if (params?.size) {
      queryParams.append('size', params.size.toString())
    }
    if (params?.childSubject) {
      queryParams.append('childSubject', params.childSubject)
    }
    if (params?.parentRole) {
      queryParams.append('parentRole', params.parentRole)
    }
    if (params?.domain) {
      queryParams.append('domain', params.domain)
    }

    const response = await apiClient.get<{
      code: number
      message: string
      data: RelationListResponseData
    }>(`/casbin/relations?${queryParams.toString()}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<RelationListResponseData>
  },

  /**
   * 创建角色继承关系
   *
   * @param data - 角色继承关系创建数据
   * @returns 操作结果
   */
  async createRelation(
    data: CreateRelationRequest
  ): Promise<ApiResponse<null>> {
    const response = await apiClient.post<{
      code: number
      message: string
      data: null
    }>('/casbin/relations', data, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },

  /**
   * 删除角色继承关系
   *
   * @param id - 角色继承关系 ID
   * @returns 操作结果
   */
  async deleteRelation(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<{
      code: number
      message: string
      data: null
    }>(`/casbin/relations/${id}`, {
      skipDataExtraction: true,
    })

    return {
      message: response.data.message,
      data: response.data.data,
    } as ApiResponse<null>
  },
}
