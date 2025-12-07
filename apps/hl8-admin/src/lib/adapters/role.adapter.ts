import type { Role } from '@/features/roles/data/schema'
import type { BackendRoleProperties } from '../services/role.service'

/**
 * 将后端状态转换为前端状态
 *
 * @param status - 后端状态（ENABLED/DISABLED）
 * @returns 前端状态（active/inactive）
 */
function mapStatus(status: 'ENABLED' | 'DISABLED'): Role['status'] {
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
 * 将后端角色属性转换为前端角色对象
 *
 * @param backendRole - 后端角色属性
 * @returns 前端角色对象
 */
export function adaptBackendRoleToFrontend(
  backendRole: BackendRoleProperties
): Role {
  return {
    id: backendRole.id,
    code: backendRole.code,
    name: backendRole.name,
    pid: backendRole.pid,
    status: mapStatus(backendRole.status),
    description: backendRole.description || '',
    createdAt: new Date(backendRole.createdAt),
    updatedAt: backendRole.updatedAt ? new Date(backendRole.updatedAt) : null,
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult {
  /**
   * 数据列表（后端使用 records）
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
 * 将后端角色列表响应转换为前端角色列表
 *
 * @param response - 后端角色列表响应（使用 records 字段）
 * @returns 前端角色列表
 */
export function adaptRoleListResponse(response: BackendPaginationResult): {
  roles: Role[]
  total: number
  current: number
  size: number
} {
  const roles = (response.records || []).map((backendRole) =>
    adaptBackendRoleToFrontend(backendRole)
  )

  return {
    roles,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
