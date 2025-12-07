import * as casbin from 'casbin';

/**
 * Casbin API 封装函数。
 *
 * 这些函数是对 Casbin Enforcer API 的简单封装，提供类型安全的接口。
 * 所有函数都返回 Promise，以支持异步操作。
 */

/**
 * 获取用户拥有的所有角色。
 *
 * @param enforcer - Casbin 策略执行器
 * @param name - 用户名
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 用户拥有的角色名称数组
 */
export function getRolesForUser(
  enforcer: casbin.Enforcer,
  name: string,
  domain?: string,
): Promise<string[]> {
  return enforcer.getRolesForUser(name, domain);
}

/**
 * 获取拥有指定角色的所有用户。
 *
 * @param enforcer - Casbin 策略执行器
 * @param name - 角色名称
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 拥有该角色的用户名数组
 */
export function getUsersForRole(
  enforcer: casbin.Enforcer,
  name: string,
  domain?: string,
): Promise<string[]> {
  return enforcer.getUsersForRole(name, domain);
}

/**
 * 检查用户是否拥有指定角色。
 *
 * @param enforcer - Casbin 策略执行器
 * @param name - 用户名
 * @param role - 角色名称
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 如果用户拥有该角色返回 true，否则返回 false
 */
export function hasRoleForUser(
  enforcer: casbin.Enforcer,
  name: string,
  role: string,
  domain?: string,
): Promise<boolean> {
  return enforcer.hasRoleForUser(name, role, domain);
}

/**
 * 为用户添加角色。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @param role - 角色名称
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 如果成功添加返回 true，否则返回 false
 */
export function addRoleForUser(
  enforcer: casbin.Enforcer,
  user: string,
  role: string,
  domain?: string,
): Promise<boolean> {
  return enforcer.addRoleForUser(user, role, domain);
}

/**
 * 删除用户的角色。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @param role - 角色名称
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deleteRoleForUser(
  enforcer: casbin.Enforcer,
  user: string,
  role: string,
  domain?: string,
): Promise<boolean> {
  return enforcer.deleteRoleForUser(user, role, domain);
}

/**
 * 删除用户的所有角色。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deleteRolesForUser(
  enforcer: casbin.Enforcer,
  user: string,
  domain?: string,
): Promise<boolean> {
  return enforcer.deleteRolesForUser(user, domain);
}

/**
 * 删除用户。
 *
 * 从策略中移除用户及其所有角色关联。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deleteUser(
  enforcer: casbin.Enforcer,
  user: string,
): Promise<boolean> {
  return enforcer.deleteUser(user);
}

/**
 * 删除角色。
 *
 * 从策略中移除角色及其所有关联。
 *
 * @param enforcer - Casbin 策略执行器
 * @param role - 角色名称
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deleteRole(
  enforcer: casbin.Enforcer,
  role: string,
): Promise<boolean> {
  return enforcer.deleteRole(role);
}

/**
 * 删除权限。
 *
 * 从策略中移除指定的权限规则。
 *
 * @param enforcer - Casbin 策略执行器
 * @param permission - 权限参数，按照 Casbin 模型定义
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deletePermission(
  enforcer: casbin.Enforcer,
  ...permission: string[]
): Promise<boolean> {
  return enforcer.deletePermission(...permission);
}

/**
 * 为用户或角色添加权限。
 *
 * @param enforcer - Casbin 策略执行器
 * @param userOrRole - 用户名或角色名称
 * @param permission - 权限参数，按照 Casbin 模型定义
 * @returns 如果成功添加返回 true，否则返回 false
 */
export function addPermissionForUser(
  enforcer: casbin.Enforcer,
  userOrRole: string,
  ...permission: string[]
): Promise<boolean> {
  return enforcer.addPermissionForUser(userOrRole, ...permission);
}

/**
 * 删除用户或角色的权限。
 *
 * @param enforcer - Casbin 策略执行器
 * @param userOrRole - 用户名或角色名称
 * @param permission - 权限参数，按照 Casbin 模型定义
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deletePermissionForUser(
  enforcer: casbin.Enforcer,
  userOrRole: string,
  ...permission: string[]
): Promise<boolean> {
  return enforcer.deletePermissionForUser(userOrRole, ...permission);
}

/**
 * 删除用户或角色的所有权限。
 *
 * @param enforcer - Casbin 策略执行器
 * @param userOrRole - 用户名或角色名称
 * @returns 如果成功删除返回 true，否则返回 false
 */
export function deletePermissionsForUser(
  enforcer: casbin.Enforcer,
  userOrRole: string,
): Promise<boolean> {
  return enforcer.deletePermissionsForUser(userOrRole);
}

/**
 * 获取用户或角色的所有权限。
 *
 * @param enforcer - Casbin 策略执行器
 * @param userOrRole - 用户名或角色名称
 * @returns 权限数组，每个权限是一个字符串数组
 */
export function getPermissionsForUser(
  enforcer: casbin.Enforcer,
  userOrRole: string,
): Promise<string[][]> {
  return enforcer.getPermissionsForUser(userOrRole);
}

/**
 * 检查用户是否拥有指定权限。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @param permission - 权限参数，按照 Casbin 模型定义
 * @returns 如果用户拥有该权限返回 true，否则返回 false
 */
export function hasPermissionForUser(
  enforcer: casbin.Enforcer,
  user: string,
  ...permission: string[]
): Promise<boolean> {
  return enforcer.hasPermissionForUser(user, ...permission);
}

/**
 * 获取用户的隐式角色（包括直接和间接角色）。
 *
 * @param enforcer - Casbin 策略执行器
 * @param name - 用户名
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 用户的所有角色（包括直接和间接角色）
 */
export function getImplicitRolesForUser(
  enforcer: casbin.Enforcer,
  name: string,
  ...domain: string[]
): Promise<string[]> {
  return enforcer.getImplicitRolesForUser(name, ...domain);
}

/**
 * 获取用户的隐式资源。
 *
 * @param enforcer - Casbin 策略执行器
 * @param name - 用户名
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 用户的所有资源（包括直接和间接资源）
 */
export function getImplicitResourcesForUser(
  enforcer: casbin.Enforcer,
  name: string,
  ...domain: string[]
): Promise<string[][]> {
  return enforcer.getImplicitResourcesForUser(name, ...domain);
}

/**
 * 获取用户的隐式权限（包括直接和间接权限）。
 *
 * @param enforcer - Casbin 策略执行器
 * @param user - 用户名
 * @param domain - 域名称（可选，用于多租户场景）
 * @returns 用户的所有权限（包括直接和间接权限）
 */
export function getImplicitPermissionsForUser(
  enforcer: casbin.Enforcer,
  user: string,
  ...domain: string[]
): Promise<string[][]> {
  return enforcer.getImplicitPermissionsForUser(user, ...domain);
}

/**
 * 获取拥有指定权限的隐式用户。
 *
 * 返回所有拥有该权限的用户，包括通过角色继承获得权限的用户。
 *
 * @param enforcer - Casbin 策略执行器
 * @param permission - 权限参数，按照 Casbin 模型定义
 * @returns 拥有该权限的用户名数组
 */
export function getImplicitUsersForPermission(
  enforcer: casbin.Enforcer,
  ...permission: string[]
): Promise<string[]> {
  return enforcer.getImplicitUsersForPermission(...permission);
}

/**
 * 管理 API
 *
 * 提供 Casbin 策略管理和执行相关的底层 API。
 */

/**
 * 执行权限检查。
 *
 * 判断主体（subject）是否可以访问对象（object）并执行操作（action）。
 *
 * @param enforcer - Casbin 策略执行器
 * @param params - 请求参数，通常是 (sub, obj, act)
 * @returns 如果请求被允许返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * const allowed = await enforce(enforcer, 'alice', 'user', 'read:any');
 * ```
 */
export function enforce(
  enforcer: casbin.Enforcer,
  ...params: any[]
): Promise<boolean> {
  return enforcer.enforce(...params);
}

/**
 * 使用自定义匹配器执行权限检查。
 *
 * 使用指定的匹配器语句来判断权限，而不是使用模型配置中的默认匹配器。
 *
 * @param enforcer - Casbin 策略执行器
 * @param matcher - 要使用的匹配器语句
 * @param params - 请求参数，通常是 (sub, obj, act)
 * @returns 如果请求被允许返回 true，否则返回 false
 */
export function enforceWithMatcher(
  enforcer: casbin.Enforcer,
  matcher: string,
  ...params: any[]
): Promise<boolean> {
  return enforcer.enforceWithMatcher(matcher, ...params);
}

/**
 * 执行权限检查并返回匹配的规则。
 *
 * 不仅返回是否允许，还返回导致该决策的策略规则。
 *
 * @param enforcer - Casbin 策略执行器
 * @param params - 请求参数，通常是 (sub, obj, act)
 * @returns 元组，第一个元素是是否允许，第二个元素是匹配的策略规则数组
 *
 * @example
 * ```typescript
 * const [allowed, rules] = await enforceEx(enforcer, 'alice', 'user', 'read:any');
 * ```
 */
export function enforceEx(
  enforcer: casbin.Enforcer,
  ...params: any[]
): Promise<[boolean, string[]]> {
  return enforcer.enforceEx(...params);
}

/**
 * 使用自定义匹配器执行权限检查并返回匹配的规则。
 *
 * @param enforcer - Casbin 策略执行器
 * @param matcher - 要使用的匹配器语句
 * @param params - 请求参数，通常是 (sub, obj, act)
 * @returns 元组，第一个元素是是否允许，第二个元素是匹配的策略规则数组
 */
export function enforceExWithMatcher(
  enforcer: casbin.Enforcer,
  matcher: string,
  ...params: any[]
): Promise<[boolean, string[]]> {
  return enforcer.enforceExWithMatcher(matcher, ...params);
}

/**
 * 批量执行权限检查。
 *
 * 对多个请求进行权限检查，返回每个请求的结果数组。
 *
 * @param enforcer - Casbin 策略执行器
 * @param params - 请求参数数组，每个请求通常是 [sub, obj, act]
 * @returns 每个请求的检查结果数组
 *
 * @example
 * ```typescript
 * const results = await batchEnforce(enforcer, [
 *   ['alice', 'user', 'read:any'],
 *   ['bob', 'role', 'write:any'],
 * ]);
 * ```
 */
export function batchEnforce(
  enforcer: casbin.Enforcer,
  params: any[][],
): Promise<boolean[]> {
  return enforcer.batchEnforce(params);
}

/**
 * 获取策略中出现的所有主体（subjects）。
 *
 * 返回所有在 "p" 策略规则中出现的主体。
 * 实际上收集的是 "p" 策略规则的第 0 个元素，所以确保主体是第 0 个元素（如 (sub, obj, act)）。
 * 重复项会被移除。
 *
 * @param enforcer - Casbin 策略执行器
 * @returns 所有主体的数组
 */
export function getAllSubjects(enforcer: casbin.Enforcer): Promise<string[]> {
  return enforcer.getAllSubjects();
}

/**
 * 获取指定命名策略类型中的所有主体。
 *
 * @param enforcer - Casbin 策略执行器
 * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
 * @returns 该策略类型中的所有主体数组
 */
export function getAllNamedSubjects(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[]> {
  return enforcer.getAllNamedSubjects(ptype);
}

/**
 * 获取策略中出现的所有对象（objects）。
 *
 * 返回所有在 "p" 策略规则中出现的对象。
 * 实际上收集的是 "p" 策略规则的第 1 个元素，所以确保对象是第 1 个元素（如 (sub, obj, act)）。
 * 重复项会被移除。
 *
 * @param enforcer - Casbin 策略执行器
 * @returns 所有对象的数组
 */
export function getAllObjects(enforcer: casbin.Enforcer): Promise<string[]> {
  return enforcer.getAllObjects();
}

/**
 * 获取指定命名策略类型中的所有对象。
 *
 * @param enforcer - Casbin 策略执行器
 * @param ptype - 策略类型，可以是 "p"、"p2"、"p3" 等
 * @returns 该策略类型中的所有对象数组
 */
export function getAllNamedObjects(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[]> {
  return enforcer.getAllNamedObjects(ptype);
}

/**
 * 获取策略中出现的所有操作（actions）。
 *
 * 返回所有在 "p" 策略规则中出现的操作。
 * 实际上收集的是 "p" 策略规则的第 2 个元素，所以确保操作是第 2 个元素（如 (sub, obj, act)）。
 * 重复项会被移除。
 *
 * @param enforcer - Casbin 策略执行器
 * @returns 所有操作的数组
 */
export function getAllActions(enforcer: casbin.Enforcer): Promise<string[]> {
  return enforcer.getAllActions();
}

export function getAllNamedActions(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[]> {
  return enforcer.getAllNamedActions(ptype);
}

export function getAllRoles(enforcer: casbin.Enforcer): Promise<string[]> {
  return enforcer.getAllRoles();
}

export function getAllNamedRoles(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[]> {
  return enforcer.getAllNamedRoles(ptype);
}

export function getPolicy(enforcer: casbin.Enforcer): Promise<string[][]> {
  return enforcer.getPolicy();
}

export function getFilteredPolicy(
  enforcer: casbin.Enforcer,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<string[][]> {
  return enforcer.getFilteredPolicy(fieldIndex, ...fieldValues);
}

export function getNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[][]> {
  return enforcer.getNamedPolicy(ptype);
}

export function getFilteredNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<string[][]> {
  return enforcer.getFilteredNamedPolicy(ptype, fieldIndex, ...fieldValues);
}

export function getGroupingPolicy(
  enforcer: casbin.Enforcer,
): Promise<string[][]> {
  return enforcer.getGroupingPolicy();
}

export function getFilteredGroupingPolicy(
  enforcer: casbin.Enforcer,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<string[][]> {
  return enforcer.getFilteredGroupingPolicy(fieldIndex, ...fieldValues);
}

export function getNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
): Promise<string[][]> {
  return enforcer.getNamedGroupingPolicy(ptype);
}

export function getFilteredNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<string[][]> {
  return enforcer.getFilteredNamedGroupingPolicy(
    ptype,
    fieldIndex,
    ...fieldValues,
  );
}

export function hasPolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.hasPolicy(...params);
}

export function hasNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.hasNamedPolicy(ptype, ...params);
}

export function addPolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.addPolicy(...params);
}

export function addPolicies(
  enforcer: casbin.Enforcer,
  rules: string[][],
): Promise<boolean> {
  return enforcer.addPolicies(rules);
}

export function addNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.addNamedPolicy(ptype, ...params);
}

export function addNamedPolicies(
  enforcer: casbin.Enforcer,
  ptype: string,
  rules: string[][],
): Promise<boolean> {
  return enforcer.addNamedPolicies(ptype, rules);
}

export function updatePolicy(
  enforcer: casbin.Enforcer,
  oldRule: string[],
  newRule: string[],
): Promise<boolean> {
  return enforcer.updatePolicy(oldRule, newRule);
}

export function updateNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  oldRule: string[],
  newRule: string[],
): Promise<boolean> {
  return enforcer.updateNamedPolicy(ptype, oldRule, newRule);
}

export function removePolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.removePolicy(...params);
}

export function removePolicies(
  enforcer: casbin.Enforcer,
  rules: string[][],
): Promise<boolean> {
  return enforcer.removePolicies(rules);
}

export function removeFilteredPolicy(
  enforcer: casbin.Enforcer,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<boolean> {
  return enforcer.removeFilteredPolicy(fieldIndex, ...fieldValues);
}

export function removeNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.removeNamedPolicy(ptype, ...params);
}

export function removeNamedPolicies(
  enforcer: casbin.Enforcer,
  ptype: string,
  rules: string[][],
): Promise<boolean> {
  return enforcer.removeNamedPolicies(ptype, rules);
}

export function removeFilteredNamedPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<boolean> {
  return enforcer.removeFilteredNamedPolicy(ptype, fieldIndex, ...fieldValues);
}

export function hasGroupingPolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.hasGroupingPolicy(...params);
}

export function hasNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.hasNamedGroupingPolicy(ptype, ...params);
}
export function addGroupingPolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.addGroupingPolicy(...params);
}
export function addGroupingPolicies(
  enforcer: casbin.Enforcer,
  rules: string[][],
): Promise<boolean> {
  return enforcer.addGroupingPolicies(rules);
}
export function addNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.addNamedGroupingPolicy(ptype, ...params);
}
export function addNamedGroupingPolicies(
  enforcer: casbin.Enforcer,
  ptype: string,
  rules: string[][],
): Promise<boolean> {
  return enforcer.addNamedGroupingPolicies(ptype, rules);
}
export function removeGroupingPolicy(
  enforcer: casbin.Enforcer,
  ...params: string[]
): Promise<boolean> {
  return enforcer.removeGroupingPolicy(...params);
}
export function removeGroupingPolicies(
  enforcer: casbin.Enforcer,
  rules: string[][],
): Promise<boolean> {
  return enforcer.removeGroupingPolicies(rules);
}
export function removeFilteredGroupingPolicy(
  enforcer: casbin.Enforcer,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<boolean> {
  return enforcer.removeFilteredGroupingPolicy(fieldIndex, ...fieldValues);
}
export function removeNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  ...params: string[]
): Promise<boolean> {
  return enforcer.removeNamedGroupingPolicy(ptype, ...params);
}
export function removeNamedGroupingPolicies(
  enforcer: casbin.Enforcer,
  ptype: string,
  rules: string[][],
): Promise<boolean> {
  return enforcer.removeNamedGroupingPolicies(ptype, rules);
}
export function removeFilteredNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  fieldIndex: number,
  ...fieldValues: string[]
): Promise<boolean> {
  return enforcer.removeFilteredNamedGroupingPolicy(
    ptype,
    fieldIndex,
    ...fieldValues,
  );
}
export function addFunction(
  enforcer: casbin.Enforcer,
  name: string,
  func: any,
): Promise<void> {
  return enforcer.addFunction(name, func);
}

export function loadPolicy(enforcer: casbin.Enforcer): Promise<void> {
  return enforcer.loadPolicy();
}

export function updateGroupingPolicy(
  enforcer: casbin.Enforcer,
  oldRule: string[],
  newRule: string[],
): Promise<boolean> {
  return enforcer.updateGroupingPolicy(oldRule, newRule);
}

export function updateNamedGroupingPolicy(
  enforcer: casbin.Enforcer,
  ptype: string,
  oldRule: string[],
  newRule: string[],
): Promise<boolean> {
  return enforcer.updateNamedGroupingPolicy(ptype, oldRule, newRule);
}
