import type { Domain } from '@/features/domains/data/schema'
import type { BackendDomainProperties } from '../services/domain.service'

/**
 * 将后端状态转换为前端状态
 *
 * @param status - 后端状态（ENABLED/DISABLED）
 * @returns 前端状态（active/inactive）
 */
function mapStatus(status: 'ENABLED' | 'DISABLED'): Domain['status'] {
  switch (status) {
    case 'ENABLED':
      return 'active'
    case 'DISABLED':
      return 'inactive'
    default:
      return 'inactive'
  }
}

/**
 * 将后端域属性转换为前端域对象
 *
 * @param backendDomain - 后端域属性
 * @returns 前端域对象
 */
export function adaptBackendDomainToFrontend(
  backendDomain: BackendDomainProperties
): Domain {
  return {
    id: backendDomain.id,
    code: backendDomain.code,
    name: backendDomain.name,
    description: backendDomain.description || '',
    status: mapStatus(backendDomain.status),
    createdAt: new Date(backendDomain.createdAt),
    updatedAt: new Date(backendDomain.updatedAt),
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult {
  /**
   * 数据列表（后端使用 records）
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
 * 将后端域列表响应转换为前端域列表
 *
 * @param response - 后端域列表响应（使用 records 字段）
 * @returns 前端域列表
 */
export function adaptDomainListResponse(response: BackendPaginationResult): {
  domains: Domain[]
  total: number
  current: number
  size: number
} {
  const domains = (response.records || []).map((backendDomain) =>
    adaptBackendDomainToFrontend(backendDomain)
  )

  return {
    domains,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
