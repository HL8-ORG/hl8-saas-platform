/**
 * 获取角色权限输入DTO
 *
 * 用于查询角色权限的输入参数。
 *
 * @class GetRolePermissionsInputDto
 * @description 获取角色权限用例的输入DTO
 */
export class GetRolePermissionsInputDto {
  /**
   * 角色ID
   *
   * @type {string}
   */
  public readonly roleId: string;

  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 是否包含详细信息
   *
   * 如果为 true，返回权限的完整信息（包括描述等元数据）。
   * 如果为 false，只返回权限的简化格式（resource 和 action）。
   *
   * @type {boolean | undefined}
   */
  public readonly withDetails?: boolean;

  /**
   * 构造函数
   *
   * 创建获取角色权限输入DTO实例。
   *
   * @param {object} params - 查询参数
   * @param {string} params.roleId - 角色ID
   * @param {string} params.tenantId - 租户ID
   * @param {boolean} [params.withDetails=false] - 是否包含详细信息
   */
  constructor(params: {
    roleId: string;
    tenantId: string;
    withDetails?: boolean;
  }) {
    this.roleId = params.roleId;
    this.tenantId = params.tenantId;
    this.withDetails = params.withDetails ?? false;
  }
}

/**
 * 权限信息
 *
 * 权限的简化格式。
 *
 * @class PermissionInfo
 */
export class PermissionInfo {
  /**
   * 资源标识
   *
   * @type {string}
   */
  public readonly resource: string;

  /**
   * 操作类型
   *
   * @type {string}
   */
  public readonly action: string;

  /**
   * 构造函数
   *
   * @param {object} params - 权限信息参数
   * @param {string} params.resource - 资源标识
   * @param {string} params.action - 操作类型
   */
  constructor(params: { resource: string; action: string }) {
    this.resource = params.resource;
    this.action = params.action;
  }
}

/**
 * 获取角色权限输出DTO
 *
 * 获取角色权限用例的输出结果。
 *
 * @class GetRolePermissionsOutputDto
 * @description 获取角色权限用例的输出DTO
 */
export class GetRolePermissionsOutputDto {
  /**
   * 权限列表
   *
   * 权限的简化格式列表（仅 resource 和 action）。
   *
   * @type {PermissionInfo[]}
   */
  public readonly permissions: PermissionInfo[];

  /**
   * 构造函数
   *
   * 创建获取角色权限输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {PermissionInfo[]} params.permissions - 权限列表
   */
  constructor(params: { permissions: PermissionInfo[] }) {
    this.permissions = params.permissions;
  }
}
