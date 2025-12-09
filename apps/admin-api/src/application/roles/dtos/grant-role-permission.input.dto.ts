/**
 * 授予角色权限输入DTO
 *
 * 用于为角色授予权限的输入参数。
 *
 * @class GrantRolePermissionInputDto
 * @description 授予角色权限用例的输入DTO
 */
export class GrantRolePermissionInputDto {
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
   * 资源标识
   *
   * 权限控制的资源标识，如 'user'、'users_list' 等。
   *
   * @type {string}
   */
  public readonly resource: string;

  /**
   * 操作类型
   *
   * 权限操作类型，如 'read:any'、'create:any' 等。
   *
   * @type {string}
   */
  public readonly action: string;

  /**
   * 权限描述
   *
   * 权限的详细描述，说明权限的用途和范围。
   *
   * @type {string | undefined}
   */
  public readonly description?: string;

  /**
   * 构造函数
   *
   * 创建授予角色权限输入DTO实例。
   *
   * @param {object} params - 授权参数
   * @param {string} params.roleId - 角色ID
   * @param {string} params.tenantId - 租户ID
   * @param {string} params.resource - 资源标识
   * @param {string} params.action - 操作类型
   * @param {string} [params.description] - 权限描述
   */
  constructor(params: {
    roleId: string;
    tenantId: string;
    resource: string;
    action: string;
    description?: string;
  }) {
    this.roleId = params.roleId;
    this.tenantId = params.tenantId;
    this.resource = params.resource;
    this.action = params.action;
    this.description = params.description;
  }
}

/**
 * 授予角色权限输出DTO
 *
 * 授予角色权限用例的输出结果。
 *
 * @class GrantRolePermissionOutputDto
 * @description 授予角色权限用例的输出DTO
 */
export class GrantRolePermissionOutputDto {
  /**
   * 成功标识
   *
   * @type {boolean}
   */
  public readonly success: boolean;

  /**
   * 消息
   *
   * @type {string}
   */
  public readonly message: string;

  /**
   * 构造函数
   *
   * 创建授予角色权限输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {boolean} params.success - 成功标识
   * @param {string} params.message - 消息
   */
  constructor(params: { success: boolean; message: string }) {
    this.success = params.success;
    this.message = params.message;
  }
}
