import { Inject, Injectable } from '@nestjs/common';
import * as casbin from 'casbin';
import { AUTHZ_ENFORCER } from '../authz.constants';
import * as authzAPI from './authz-api';

/**
 * 授权服务
 *
 * Casbin RBAC API 和 Management API 的统一封装服务。
 * 提供完整的权限管理功能，包括：
 * - RBAC 相关操作（用户-角色、角色-权限管理）
 * - 策略管理操作（策略的增删改查）
 * - 权限检查操作（单个和批量）
 *
 * 所有方法都转换为异步，以支持未来的 IO 操作。
 *
 * @class AuthZService
 * @description 基于 Casbin 的授权服务，提供完整的权限管理功能
 *
 * @example
 * ```typescript
 * constructor(private readonly authzSrv: AuthZService) {}
 *
 * async managePermissions() {
 *   // 为用户添加角色
 *   await this.authzSrv.addRoleForUser('alice', 'admin');
 *
 *   // 为角色添加权限
 *   await this.authzSrv.addPermissionForUser('admin', 'user', 'read:any');
 *
 *   // 检查用户权限
 *   const allowed = await this.authzSrv.enforce('alice', 'user', 'read:any');
 * }
 * ```
 */
@Injectable()
export class AuthZService {
  /**
   * 构造函数。
   *
   * @param enforcer - Casbin 策略执行器实例
   */
  constructor(
    @Inject(AUTHZ_ENFORCER)
    public readonly enforcer: casbin.Enforcer,
  ) {}

  /**
   * ==================== RBAC API ====================
   * 基于角色的访问控制（RBAC）相关操作
   */

  /**
   * 获取用户拥有的所有角色
   *
   * 查询指定用户直接分配的所有角色（不包括继承的角色）。
   * 如需获取包括继承角色在内的所有角色，请使用 `getImplicitRolesForUser()`。
   *
   * @param {string} name - 用户名（用户 ID）
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<string[]>} 用户拥有的角色名称数组
   *
   * @example
   * ```typescript
   * const roles = await authzService.getRolesForUser('user-123');
   * // 返回: ['admin', 'editor']
   * ```
   */
  getRolesForUser(name: string, domain?: string): Promise<string[]> {
    return authzAPI.getRolesForUser(this.enforcer, name, domain);
  }

  /**
   * 获取拥有指定角色的所有用户
   *
   * 查询所有被分配了指定角色的用户列表。
   *
   * @param {string} name - 角色名称
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<string[]>} 拥有该角色的用户 ID 数组
   *
   * @example
   * ```typescript
   * const users = await authzService.getUsersForRole('admin');
   * // 返回: ['user-123', 'user-456']
   * ```
   */
  getUsersForRole(name: string, domain?: string): Promise<string[]> {
    return authzAPI.getUsersForRole(this.enforcer, name, domain);
  }

  /**
   * 检查用户是否拥有指定角色
   *
   * 判断用户是否被直接分配了指定角色（不包括继承的角色）。
   *
   * @param {string} name - 用户名（用户 ID）
   * @param {string} role - 角色名称
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<boolean>} 如果用户拥有该角色返回 `true`，否则返回 `false`
   *
   * @example
   * ```typescript
   * const hasRole = await authzService.hasRoleForUser('user-123', 'admin');
   * // 返回: true 或 false
   * ```
   */
  hasRoleForUser(
    name: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.hasRoleForUser(this.enforcer, name, role, domain);
  }

  /**
   * 为用户分配角色
   *
   * 将指定角色分配给用户。如果用户已经拥有该角色，则返回 `false`（未受影响）。
   *
   * @param {string} user - 用户名（用户 ID）
   * @param {string} role - 角色名称
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<boolean>} 如果成功添加返回 `true`，如果用户已拥有该角色返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.addRoleForUser('user-123', 'admin');
   * // 返回: true（成功）或 false（用户已拥有该角色）
   * ```
   */
  addRoleForUser(
    user: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.addRoleForUser(this.enforcer, user, role, domain);
  }

  /**
   * 取消用户的角色分配
   *
   * 移除用户的指定角色。如果用户没有该角色，则返回 `false`（未受影响）。
   *
   * @param {string} user - 用户名（用户 ID）
   * @param {string} role - 角色名称
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<boolean>} 如果成功移除返回 `true`，如果用户没有该角色返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deleteRoleForUser('user-123', 'admin');
   * // 返回: true（成功）或 false（用户没有该角色）
   * ```
   */
  deleteRoleForUser(
    user: string,
    role: string,
    domain?: string,
  ): Promise<boolean> {
    return authzAPI.deleteRoleForUser(this.enforcer, user, role, domain);
  }

  /**
   * 删除用户的所有角色
   *
   * 移除用户的所有角色分配。如果用户没有任何角色，则返回 `false`（未受影响）。
   *
   * @param {string} user - 用户名（用户 ID）
   * @param {string} [domain] - 域名称（可选，用于多租户场景）
   * @returns {Promise<boolean>} 如果成功移除返回 `true`，如果用户没有角色返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deleteRolesForUser('user-123');
   * // 返回: true（成功）或 false（用户没有角色）
   * ```
   */
  deleteRolesForUser(user: string, domain?: string): Promise<boolean> {
    return authzAPI.deleteRolesForUser(this.enforcer, user, domain);
  }

  /**
   * 删除用户及其所有关联
   *
   * 删除用户及其所有角色和权限关联。如果用户不存在，则返回 `false`（未受影响）。
   *
   * @param {string} user - 用户名（用户 ID）
   * @returns {Promise<boolean>} 如果成功删除返回 `true`，如果用户不存在返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deleteUser('user-123');
   * // 返回: true（成功）或 false（用户不存在）
   * ```
   */
  async deleteUser(user: string): Promise<boolean> {
    return authzAPI.deleteUser(this.enforcer, user);
  }

  /**
   * 删除角色及其所有关联
   *
   * 删除角色及其所有用户关联和权限关联。如果角色不存在，则返回 `false`。
   *
   * @param {string} role - 角色名称
   * @returns {Promise<boolean>} 如果成功删除返回 `true`，如果角色不存在返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deleteRole('admin');
   * // 返回: true（成功）或 false（角色不存在）
   * ```
   */
  deleteRole(role: string): Promise<boolean> {
    return authzAPI.deleteRole(this.enforcer, role);
  }

  /**
   * 删除权限规则
   *
   * 从策略中删除指定的权限规则。如果权限规则不存在，则返回 `false`（未受影响）。
   *
   * @param {...string[]} permission - 权限规则参数，按照 Casbin 模型定义（通常是 subject, object, action）
   * @returns {Promise<boolean>} 如果成功删除返回 `true`，如果权限规则不存在返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deletePermission('admin', 'user', 'read:any');
   * // 返回: true（成功）或 false（权限规则不存在）
   * ```
   */
  deletePermission(...permission: string[]): Promise<boolean> {
    return authzAPI.deletePermission(this.enforcer, ...permission);
  }

  /**
   * 为用户或角色添加权限
   *
   * 为指定的用户或角色添加权限规则。如果用户或角色已经拥有该权限，则返回 `false`（未受影响）。
   *
   * @param {string} userOrRole - 用户名（用户 ID）或角色名称
   * @param {...string[]} permission - 权限规则参数，按照 Casbin 模型定义（通常是 object, action）
   * @returns {Promise<boolean>} 如果成功添加返回 `true`，如果已存在该权限返回 `false`
   *
   * @example
   * ```typescript
   * // 为角色添加权限
   * const success = await authzService.addPermissionForUser('admin', 'user', 'read:any');
   * // 返回: true（成功）或 false（权限已存在）
   *
   * // 为用户直接添加权限
   * const success2 = await authzService.addPermissionForUser('user-123', 'user', 'read:own');
   * ```
   */
  addPermissionForUser(
    userOrRole: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.addPermissionForUser(
      this.enforcer,
      userOrRole,
      ...permission,
    );
  }

  /**
   * 删除用户或角色的权限
   *
   * 移除指定用户或角色的权限规则。如果用户或角色没有该权限，则返回 `false`（未受影响）。
   *
   * @param {string} userOrRole - 用户名（用户 ID）或角色名称
   * @param {...string[]} permission - 权限规则参数，按照 Casbin 模型定义（通常是 object, action）
   * @returns {Promise<boolean>} 如果成功移除返回 `true`，如果权限不存在返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deletePermissionForUser('admin', 'user', 'read:any');
   * // 返回: true（成功）或 false（权限不存在）
   * ```
   */
  deletePermissionForUser(
    userOrRole: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.deletePermissionForUser(
      this.enforcer,
      userOrRole,
      ...permission,
    );
  }

  /**
   * 删除用户或角色的所有权限
   *
   * 移除指定用户或角色的所有权限规则。如果用户或角色没有任何权限，则返回 `false`（未受影响）。
   *
   * @param {string} userOrRole - 用户名（用户 ID）或角色名称
   * @returns {Promise<boolean>} 如果成功移除返回 `true`，如果没有权限返回 `false`
   *
   * @example
   * ```typescript
   * const success = await authzService.deletePermissionsForUser('admin');
   * // 返回: true（成功）或 false（没有权限）
   * ```
   */
  deletePermissionsForUser(userOrRole: string): Promise<boolean> {
    return authzAPI.deletePermissionsForUser(this.enforcer, userOrRole);
  }

  /**
   * 获取用户或角色的所有权限
   *
   * 查询指定用户或角色直接拥有的所有权限（不包括通过角色继承的权限）。
   * 如需获取包括继承权限在内的所有权限，请使用 `getImplicitPermissionsForUser()`。
   *
   * @param {string} userOrRole - 用户名（用户 ID）或角色名称
   * @returns {Promise<string[][]>} 权限规则数组，每个规则是一个字符串数组（如 `[subject, object, action]`）
   *
   * @example
   * ```typescript
   * const permissions = await authzService.getPermissionsForUser('admin');
   * // 返回: [['admin', 'user', 'read:any'], ['admin', 'user', 'write:any']]
   * ```
   */
  getPermissionsForUser(userOrRole: string): Promise<string[][]> {
    return authzAPI.getPermissionsForUser(this.enforcer, userOrRole);
  }

  /**
   * 检查用户是否拥有指定权限
   *
   * 判断用户是否拥有指定的权限（包括通过角色继承的权限）。
   *
   * @param {string} user - 用户名（用户 ID）
   * @param {...string[]} permission - 权限规则参数，按照 Casbin 模型定义（通常是 object, action）
   * @returns {Promise<boolean>} 如果用户拥有该权限返回 `true`，否则返回 `false`
   *
   * @example
   * ```typescript
   * const hasPermission = await authzService.hasPermissionForUser('user-123', 'user', 'read:any');
   * // 返回: true 或 false
   * ```
   */
  hasPermissionForUser(
    user: string,
    ...permission: string[]
  ): Promise<boolean> {
    return authzAPI.hasPermissionForUser(this.enforcer, user, ...permission);
  }

  /**
   * 获取用户的所有角色（包括隐式角色）
   *
   * 与 `getRolesForUser()` 不同，此方法会返回包括继承角色在内的所有角色。
   * 例如：如果用户拥有 `admin` 角色，而 `admin` 角色继承自 `user` 角色，
   * 则此方法会返回 `['admin', 'user']`，而 `getRolesForUser()` 只返回 `['admin']`。
   *
   * @param {string} name - 用户名（用户 ID）
   * @param {...string[]} domain - 域名称（可选，用于多租户场景）
   * @returns {Promise<string[]>} 用户拥有的所有角色名称数组（包括直接和继承的角色）
   *
   * @example
   * ```typescript
   * // 策略示例：
   * // g, alice, role:admin
   * // g, role:admin, role:user
   *
   * const roles = await authzService.getImplicitRolesForUser('alice');
   * // 返回: ['role:admin', 'role:user']（包括继承的角色）
   *
   * const directRoles = await authzService.getRolesForUser('alice');
   * // 返回: ['role:admin']（只包括直接分配的角色）
   * ```
   */
  getImplicitRolesForUser(
    name: string,
    ...domain: string[]
  ): Promise<string[]> {
    return authzAPI.getImplicitRolesForUser(this.enforcer, name, ...domain);
  }

  /**
   * 获取用户可访问的所有资源（包括隐式资源）
   *
   * 返回用户直接拥有的权限和通过角色继承的权限所对应的所有资源。
   *
   * @param {string} name - 用户名（用户 ID）
   * @param {...string[]} domain - 域名称（可选，用于多租户场景）
   * @returns {Promise<string[][]>} 资源权限规则数组，每个规则是一个字符串数组
   *
   * @example
   * ```typescript
   * // 策略示例：
   * // g, alice, role:admin
   * // p, alice, resource1, read
   * // p, role:admin, resource1, write
   *
   * const resources = await authzService.getImplicitResourcesForUser('alice');
   * // 返回: [['alice', 'resource1', 'read'], ['role:admin', 'resource1', 'write']]
   * ```
   */
  getImplicitResourcesForUser(
    name: string,
    ...domain: string[]
  ): Promise<string[][]> {
    return authzAPI.getImplicitResourcesForUser(this.enforcer, name, ...domain);
  }

  /**
   * 获取用户或角色的所有权限（包括隐式权限）
   *
   * 与 `getPermissionsForUser()` 不同，此方法会返回包括通过角色继承的权限在内的所有权限。
   *
   * @param {string} user - 用户名（用户 ID）
   * @param {...string[]} domain - 域名称（可选，用于多租户场景）
   * @returns {Promise<string[][]>} 权限规则数组，每个规则是一个字符串数组（包括直接和继承的权限）
   *
   * @example
   * ```typescript
   * // 策略示例：
   * // p, admin, data1, read
   * // p, alice, data2, read
   * // g, alice, admin
   *
   * const implicitPermissions = await authzService.getImplicitPermissionsForUser('alice');
   * // 返回: [['admin', 'data1', 'read'], ['alice', 'data2', 'read']]（包括继承的权限）
   *
   * const directPermissions = await authzService.getPermissionsForUser('alice');
   * // 返回: [['alice', 'data2', 'read']]（只包括直接分配的权限）
   * ```
   */
  getImplicitPermissionsForUser(
    user: string,
    ...domain: string[]
  ): Promise<string[][]> {
    return authzAPI.getImplicitPermissionsForUser(
      this.enforcer,
      user,
      ...domain,
    );
  }
  /**
   * 获取拥有指定权限的所有用户（包括隐式用户）
   *
   * 返回所有拥有指定权限的用户，包括直接拥有该权限的用户和通过角色继承该权限的用户。
   * 注意：只返回用户，不返回角色。
   *
   * @param {...string[]} permission - 权限规则参数，按照 Casbin 模型定义（通常是 object, action）
   * @returns {Promise<string[]>} 拥有该权限的用户 ID 数组
   *
   * @example
   * ```typescript
   * // 策略示例：
   * // p, admin, data1, read
   * // p, bob, data1, read
   * // g, alice, admin
   *
   * const users = await authzService.getImplicitUsersForPermission('data1', 'read');
   * // 返回: ['alice', 'bob']（alice 通过 admin 角色继承权限）
   * ```
   */
  getImplicitUsersForPermission(...permission: string[]): Promise<string[]> {
    return authzAPI.getImplicitUsersForPermission(this.enforcer, ...permission);
  }

  /**
   * ==================== Management API ====================
   * 策略管理和权限检查相关操作
   */

  /**
   * 权限检查
   *
   * 判断主体（subject）是否可以对对象（object）执行操作（action）。
   * 这是 Casbin 的核心方法，用于执行权限验证。
   *
   * @param {...any[]} params - 请求参数，通常是 `(subject, object, action)` 三元组
   * @returns {Promise<boolean>} 如果允许访问返回 `true`，否则返回 `false`
   *
   * @example
   * ```typescript
   * const allowed = await authzService.enforce('user-123', 'user', 'read:any');
   * // 返回: true（允许）或 false（拒绝）
   * ```
   */
  enforce(...params: any[]): Promise<boolean> {
    return authzAPI.enforce(this.enforcer, ...params);
  }

  /**
   * 使用自定义匹配器进行权限检查
   *
   * 使用指定的匹配器表达式来判断主体是否可以对对象执行操作。
   * 适用于需要临时使用不同匹配规则的场景。
   *
   * @param {string} matcher - 匹配器表达式
   * @param {...any[]} params - 请求参数，通常是 `(subject, object, action)` 三元组
   * @returns {Promise<boolean>} 如果允许访问返回 `true`，否则返回 `false`
   *
   * @example
   * ```typescript
   * const matcher = 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act';
   * const allowed = await authzService.enforceWithMatcher(matcher, 'user-123', 'user', 'read:any');
   * ```
   */
  enforceWithMatcher(matcher: string, ...params: any[]): Promise<boolean> {
    return authzAPI.enforceWithMatcher(this.enforcer, matcher, ...params);
  }

  /**
   * 权限检查（带解释）
   *
   * 执行权限检查并返回匹配的策略规则，用于调试和审计。
   *
   * @param {...any[]} params - 请求参数，通常是 `(subject, object, action)` 三元组
   * @returns {Promise<[boolean, string[]]>} 返回 `[是否允许, 匹配的策略规则]`
   *
   * @example
   * ```typescript
   * const [allowed, matchedRule] = await authzService.enforceEx('user-123', 'user', 'read:any');
   * // 返回: [true, ['admin', 'user', 'read:any']] 或 [false, []]
   * ```
   */
  enforceEx(...params: any[]): Promise<[boolean, string[]]> {
    return authzAPI.enforceEx(this.enforcer, ...params);
  }

  /**
   * 使用自定义匹配器进行权限检查（带解释）
   *
   * 使用指定的匹配器表达式执行权限检查，并返回匹配的策略规则。
   *
   * @param {string} matcher - 匹配器表达式
   * @param {...any[]} params - 请求参数，通常是 `(subject, object, action)` 三元组
   * @returns {Promise<[boolean, string[]]>} 返回 `[是否允许, 匹配的策略规则]`
   *
   * @example
   * ```typescript
   * const matcher = 'g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act';
   * const [allowed, matchedRule] = await authzService.enforceExWithMatcher(
   *   matcher,
   *   'user-123',
   *   'user',
   *   'read:any'
   * );
   * ```
   */
  enforceExWithMatcher(
    matcher: string,
    ...params: any[]
  ): Promise<[boolean, string[]]> {
    return authzAPI.enforceExWithMatcher(this.enforcer, matcher, ...params);
  }

  /**
   * 批量权限检查
   *
   * 对多个权限请求进行批量检查，返回每个请求的检查结果。
   * 适用于需要同时检查多个权限的场景，性能优于多次调用 `enforce()`。
   *
   * @param {any[][]} params - 请求参数数组，每个元素是一个请求参数数组（通常是 `[subject, object, action]`）
   * @returns {Promise<boolean[]>} 每个请求的检查结果数组
   *
   * @example
   * ```typescript
   * const requests = [
   *   ['user-123', 'user', 'read:any'],
   *   ['user-123', 'user', 'write:any'],
   *   ['user-456', 'role', 'read:any']
   * ];
   * const results = await authzService.batchEnforce(requests);
   * // 返回: [true, false, true]
   * ```
   */
  batchEnforce(params: any[][]): Promise<boolean[]> {
    return authzAPI.batchEnforce(this.enforcer, params);
  }

  /**
   * getAllSubjects gets the list of subjects that show up in the current policy.
   *
   * @return all the subjects in "p" policy rules. It actually collects the
   *         0-index elements of "p" policy rules. So make sure your subject
   *         is the 0-index element, like (sub, obj, act). Duplicates are removed.
   */
  getAllSubjects(): Promise<string[]> {
    return authzAPI.getAllSubjects(this.enforcer);
  }
  /**
   * getAllNamedSubjects gets the list of subjects that show up in the currentnamed policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make sure
   *         your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedSubjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedSubjects(this.enforcer, ptype);
  }
  /**
   * getAllObjects gets the list of objects that show up in the current policy.
   *
   * @return all the objects in "p" policy rules. It actually collects the
   *         1-index elements of "p" policy rules. So make sure your object
   *         is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllObjects(): Promise<string[]> {
    return authzAPI.getAllObjects(this.enforcer);
  }
  /**
   * getAllNamedObjects gets the list of objects that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the objects in policy rules of the ptype type. It actually
   *         collects the 1-index elements of the policy rules. So make sure
   *         your object is the 1-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedObjects(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedObjects(this.enforcer, ptype);
  }
  /**
   * getAllActions gets the list of actions that show up in the current policy.
   *
   * @return all the actions in "p" policy rules. It actually collects
   *         the 2-index elements of "p" policy rules. So make sure your action
   *         is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllActions(): Promise<string[]> {
    return authzAPI.getAllActions(this.enforcer);
  }
  /**
   * GetAllNamedActions gets the list of actions that show up in the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return all the actions in policy rules of the ptype type. It actually
   *         collects the 2-index elements of the policy rules. So make sure
   *         your action is the 2-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedActions(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedActions(this.enforcer, ptype);
  }
  /**
   * getAllRoles gets the list of roles that show up in the current policy.
   *
   * @return all the roles in "g" policy rules. It actually collects
   *         the 1-index elements of "g" policy rules. So make sure your
   *         role is the 1-index element, like (sub, role).
   *         Duplicates are removed.
   */
  getAllRoles(): Promise<string[]> {
    return authzAPI.getAllRoles(this.enforcer);
  }
  /**
   * getAllNamedRoles gets the list of roles that show up in the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return all the subjects in policy rules of the ptype type. It actually
   *         collects the 0-index elements of the policy rules. So make
   *         sure your subject is the 0-index element, like (sub, obj, act).
   *         Duplicates are removed.
   */
  getAllNamedRoles(ptype: string): Promise<string[]> {
    return authzAPI.getAllNamedRoles(this.enforcer, ptype);
  }
  /**
   * getPolicy gets all the authorization rules in the policy.
   *
   * @return all the "p" policy rules.
   */
  getPolicy(): Promise<string[][]> {
    return authzAPI.getPolicy(this.enforcer);
  }
  /**
   * getFilteredPolicy gets all the authorization rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules.
   */
  getFilteredPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * getNamedPolicy gets all the authorization rules in the named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @return the "p" policy rules of the specified ptype.
   */
  getNamedPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedPolicy(this.enforcer, ptype);
  }
  /**
   * getFilteredNamedPolicy gets all the authorization rules in the named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "p" policy rules of the specified ptype.
   */
  getFilteredNamedPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredNamedPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * getGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @return all the "g" policy rules.
   */
  getGroupingPolicy(): Promise<string[][]> {
    return authzAPI.getGroupingPolicy(this.enforcer);
  }
  /**
   * getFilteredGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value "" means not to match this field.
   * @return the filtered "g" policy rules.
   */
  getFilteredGroupingPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredGroupingPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * getNamedGroupingPolicy gets all the role inheritance rules in the policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @return the "g" policy rules of the specified ptype.
   */
  getNamedGroupingPolicy(ptype: string): Promise<string[][]> {
    return authzAPI.getNamedGroupingPolicy(this.enforcer, ptype);
  }
  /**
   * getFilteredNamedGroupingPolicy gets all the role inheritance rules in the policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return the filtered "g" policy rules of the specified ptype.
   */
  getFilteredNamedGroupingPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<string[][]> {
    return authzAPI.getFilteredNamedGroupingPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * hasPolicy determines whether an authorization rule exists.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return whether the rule exists.
   */
  hasPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasPolicy(this.enforcer, ...params);
  }
  /**
   * hasNamedPolicy determines whether a named authorization rule exists.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return whether the rule exists.
   */
  hasNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addPolicy adds an authorization rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  addPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addPolicy(this.enforcer, ...params);
  }

  /**
   * addPolicies adds authorization rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param rules the "p" policy rules, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  addPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addPolicies(this.enforcer, rules);
  }

  /**
   * addNamedPolicy adds an authorization rule to the current named policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  addNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedPolicy(this.enforcer, ptype, ...params);
  }

  /**
   * addNamedPolicies adds authorization rules to the current named policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param rules the "p" policy rules.
   * @return succeeds or not.
   */
  addNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedPolicies(this.enforcer, ptype, rules);
  }

  /**
   * updatePolicy updates an authorization rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @return succeeds or not.
   * @param oldRule the policy will be remove
   * @param newRule the policy will be added
   */
  updatePolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updatePolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * updateNamedPolicy updates an authorization rule from the current named policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param oldRule the policy rule will be remove
   * @param newRule the policy rule will be added
   * @return succeeds or not.
   */
  updateNamedPolicy(
    ptype: string,
    oldRule: string[],
    newRule: string[],
  ): Promise<boolean> {
    return authzAPI.updateNamedPolicy(this.enforcer, ptype, oldRule, newRule);
  }

  /**
   * removePolicy removes an authorization rule from the current policy.
   *
   * @param params the "p" policy rule, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  removePolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removePolicy(this.enforcer, ...params);
  }
  /**
   * removePolicies removes an authorization rules from the current policy.
   *
   * @param rules the "p" policy rules, ptype "p" is implicitly used.
   * @return succeeds or not.
   */
  removePolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removePolicies(this.enforcer, rules);
  }
  /**
   * removeFilteredPolicy removes an authorization rule from the current policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  removeFilteredPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * removeNamedPolicy removes an authorization rule from the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param params the "p" policy rule.
   * @return succeeds or not.
   */
  removeNamedPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.removeNamedPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * removeNamedPolicies removes authorization rules from the current named policy.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param rules the "p" policy rules.
   * @return succeeds or not.
   */
  removeNamedPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.removeNamedPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeFilteredNamedPolicy removes an authorization rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "p", "p2", "p3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  removeFilteredNamedPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredNamedPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * hasGroupingPolicy determines whether a role inheritance rule exists.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return whether the rule exists.
   */
  hasGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.hasGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * hasNamedGroupingPolicy determines whether a named role inheritance rule exists.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return whether the rule exists.
   */
  hasNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.hasNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addGroupingPolicy adds a role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  addGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.addGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * addGroupingPolicies adds a role inheritance rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param rules the "g" policy rules, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  addGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.addGroupingPolicies(this.enforcer, rules);
  }
  /**
   * addNamedGroupingPolicy adds a named role inheritance rule to the current policy.
   * If the rule already exists, the function returns false and the rule will not be added.
   * Otherwise the function returns true by adding the new rule.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  addNamedGroupingPolicy(ptype: string, ...params: string[]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * addNamedGroupingPolicies adds named role inheritance rules to the current policy.
   * If the rule already exists, the function returns false and the rules will not be added.
   * Otherwise the function returns true by adding the new rules.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param rules the "g" policy rule.
   * @return succeeds or not.
   */
  addNamedGroupingPolicies(ptype: string, rules: string[][]): Promise<boolean> {
    return authzAPI.addNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeGroupingPolicy removes a role inheritance rule from the current policy.
   *
   * @param params the "g" policy rule, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  removeGroupingPolicy(...params: string[]): Promise<boolean> {
    return authzAPI.removeGroupingPolicy(this.enforcer, ...params);
  }
  /**
   * removeGroupingPolicies removes role inheritance rules from the current policy.
   *
   * @param rules the "g" policy rules, ptype "g" is implicitly used.
   * @return succeeds or not.
   */
  removeGroupingPolicies(rules: string[][]): Promise<boolean> {
    return authzAPI.removeGroupingPolicies(this.enforcer, rules);
  }
  /**
   * removeFilteredGroupingPolicy removes a role inheritance rule from the current policy, field filters can be specified.
   *
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  removeFilteredGroupingPolicy(
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredGroupingPolicy(
      this.enforcer,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * removeNamedGroupingPolicy removes a role inheritance rule from the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param params the "g" policy rule.
   * @return succeeds or not.
   */
  removeNamedGroupingPolicy(
    ptype: string,
    ...params: string[]
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicy(this.enforcer, ptype, ...params);
  }
  /**
   * removeNamedGroupingPolicies removes role inheritance rules from the current named policy.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param rules the "g" policy rules.
   * @return succeeds or not.
   */
  removeNamedGroupingPolicies(
    ptype: string,
    rules: string[][],
  ): Promise<boolean> {
    return authzAPI.removeNamedGroupingPolicies(this.enforcer, ptype, rules);
  }
  /**
   * removeFilteredNamedGroupingPolicy removes a role inheritance rule from the current named policy, field filters can be specified.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param fieldIndex the policy rule's start index to be matched.
   * @param fieldValues the field values to be matched, value ""
   *                    means not to match this field.
   * @return succeeds or not.
   */
  removeFilteredNamedGroupingPolicy(
    ptype: string,
    fieldIndex: number,
    ...fieldValues: string[]
  ): Promise<boolean> {
    return authzAPI.removeFilteredNamedGroupingPolicy(
      this.enforcer,
      ptype,
      fieldIndex,
      ...fieldValues,
    );
  }
  /**
   * addFunction adds a customized function.
   * @param name custom function name
   * @param func function
   */
  addFunction(name: string, func: any): Promise<void> {
    return authzAPI.addFunction(this.enforcer, name, func);
  }

  /**
   * loadPolicy reloads the policy from file/database.
   */
  loadPolicy(): Promise<void> {
    return authzAPI.loadPolicy(this.enforcer);
  }

  /**
   * updateGroupingPolicy updates a role inheritance rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param oldRule the role inheritance rule will be remove
   * @param newRule the role inheritance rule will be added
   * @return succeeds or not.
   */
  updateGroupingPolicy(oldRule: string[], newRule: string[]): Promise<boolean> {
    return authzAPI.updateGroupingPolicy(this.enforcer, oldRule, newRule);
  }

  /**
   * updateNamedGroupingPolicy updates a named role inheritance rule from the current policy.
   * If the rule not exists, the function returns false.
   * Otherwise the function returns true by changing it to the new rule.
   *
   * @param ptype the policy type, can be "g", "g2", "g3", ..
   * @param oldRule the role inheritance rule will be remove
   * @param newRule the role inheritance rule will be added
   * @return succeeds or not.
   */
  updateNamedGroupingPolicy(
    ptype: string,
    oldRule: string[],
    newRule: string[],
  ): Promise<boolean> {
    return authzAPI.updateNamedGroupingPolicy(
      this.enforcer,
      ptype,
      oldRule,
      newRule,
    );
  }
}
