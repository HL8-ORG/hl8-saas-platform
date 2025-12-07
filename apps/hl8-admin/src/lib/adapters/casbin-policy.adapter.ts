import type {
  BackendPolicyRuleDto,
  BackendRoleRelationDto,
} from '../services/casbin-policy.service'

/**
 * 前端策略规则类型
 */
export interface PolicyRule {
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
 * 前端角色继承关系类型
 */
export interface RoleRelation {
  id: number
  childSubject: string
  parentRole: string
  domain?: string
}

/**
 * 将后端策略规则 DTO 转换为前端策略规则对象
 *
 * @param backendPolicy - 后端策略规则 DTO
 * @returns 前端策略规则对象
 */
export function adaptBackendPolicyToFrontend(
  backendPolicy: BackendPolicyRuleDto
): PolicyRule {
  return {
    id: backendPolicy.id,
    ptype: backendPolicy.ptype,
    subject: backendPolicy.subject,
    object: backendPolicy.object,
    action: backendPolicy.action,
    domain: backendPolicy.domain,
    effect: backendPolicy.effect,
    v4: backendPolicy.v4,
    v5: backendPolicy.v5,
  }
}

/**
 * 将后端角色继承关系 DTO 转换为前端角色继承关系对象
 *
 * @param backendRelation - 后端角色继承关系 DTO
 * @returns 前端角色继承关系对象
 */
export function adaptBackendRelationToFrontend(
  backendRelation: BackendRoleRelationDto
): RoleRelation {
  return {
    id: backendRelation.id,
    childSubject: backendRelation.childSubject,
    parentRole: backendRelation.parentRole,
    domain: backendRelation.domain,
  }
}

/**
 * 后端分页结果格式
 */
export interface BackendPaginationResult<T> {
  data: T[]
  total: number
  current: number
  size: number
}

/**
 * 将后端策略规则列表响应转换为前端策略规则列表
 *
 * @param response - 后端策略规则列表响应
 * @returns 前端策略规则列表
 */
export function adaptPolicyListResponse(
  response: BackendPaginationResult<BackendPolicyRuleDto>
): {
  policies: PolicyRule[]
  total: number
  current: number
  size: number
} {
  const policies = (response.data || []).map((backendPolicy) =>
    adaptBackendPolicyToFrontend(backendPolicy)
  )

  return {
    policies,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}

/**
 * 将后端角色继承关系列表响应转换为前端角色继承关系列表
 *
 * @param response - 后端角色继承关系列表响应
 * @returns 前端角色继承关系列表
 */
export function adaptRelationListResponse(
  response: BackendPaginationResult<BackendRoleRelationDto>
): {
  relations: RoleRelation[]
  total: number
  current: number
  size: number
} {
  const relations = (response.data || []).map((backendRelation) =>
    adaptBackendRelationToFrontend(backendRelation)
  )

  return {
    relations,
    total: response.total,
    current: response.current,
    size: response.size,
  }
}
