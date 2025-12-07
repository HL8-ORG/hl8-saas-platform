import type { User } from '@/features/users/data/schema'
import type { BackendUserProperties } from '../services/user.service'

/**
 * 将后端状态转换为前端状态
 *
 * @param status - 后端状态（ACTIVE/INACTIVE）
 * @returns 前端状态（active/inactive/invited/suspended）
 */
function mapStatus(status: 'ACTIVE' | 'INACTIVE'): User['status'] {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'INACTIVE':
      return 'inactive'
    default:
      return 'inactive'
  }
}

/**
 * 将后端角色转换为前端角色
 * 注意：后端可能没有直接返回角色，这里使用默认值
 * 实际应该从用户角色关联中获取
 *
 * @param roles - 后端角色列表（如果有）
 * @returns 前端角色
 */
function mapRole(roles?: string[]): User['role'] {
  // 如果后端返回了角色，使用第一个角色
  // 否则使用默认角色 'admin'
  if (roles && roles.length > 0) {
    const role = roles[0].toLowerCase()
    if (['superadmin', 'admin', 'cashier', 'manager'].includes(role)) {
      return role as User['role']
    }
  }
  return 'admin'
}

/**
 * 将昵称拆分为 firstName 和 lastName
 *
 * @param nickName - 昵称
 * @returns 包含 firstName 和 lastName 的对象
 */
function splitName(nickName: string): { firstName: string; lastName: string } {
  const parts = nickName.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * 将后端用户属性转换为前端用户对象
 *
 * @param backendUser - 后端用户属性
 * @param roles - 用户角色列表（可选）
 * @returns 前端用户对象
 */
export function adaptBackendUserToFrontend(
  backendUser: BackendUserProperties,
  roles?: string[]
): User {
  const { firstName, lastName } = splitName(backendUser.nickName || '')

  return {
    id: backendUser.id,
    firstName: firstName || backendUser.username,
    lastName: lastName,
    username: backendUser.username,
    email: backendUser.email || '',
    phoneNumber: backendUser.phoneNumber || '',
    status: mapStatus(backendUser.status),
    role: mapRole(roles),
    createdAt: new Date(backendUser.createdAt),
    updatedAt: new Date(backendUser.updatedAt),
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult {
  /**
   * 数据列表（后端使用 records）
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
 * 将后端用户列表响应转换为前端用户列表
 *
 * @param response - 后端用户列表响应（使用 records 字段）
 * @returns 前端用户列表
 */
export function adaptUserListResponse(response: BackendPaginationResult): {
  users: User[]
  total: number
  current: number
  size: number
} {
  const users = (response.records || []).map((backendUser) =>
    adaptBackendUserToFrontend(backendUser)
  )

  return {
    users,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
