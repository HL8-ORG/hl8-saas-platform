/**
 * 根据ID获取角色输入DTO
 *
 * 用于根据ID查询角色的输入参数。
 *
 * @class GetRoleByIdInputDto
 * @description 根据ID获取角色用例的输入DTO
 */
export class GetRoleByIdInputDto {
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
   * 构造函数
   *
   * 创建根据ID获取角色输入DTO实例。
   *
   * @param {object} params - 查询参数
   * @param {string} params.roleId - 角色ID
   * @param {string} params.tenantId - 租户ID
   */
  constructor(params: { roleId: string; tenantId: string }) {
    this.roleId = params.roleId;
    this.tenantId = params.tenantId;
  }
}

/**
 * 根据ID获取角色输出DTO
 *
 * 根据ID获取角色用例的输出结果。
 *
 * @class GetRoleByIdOutputDto
 * @description 根据ID获取角色用例的输出DTO
 */
export class GetRoleByIdOutputDto {
  /**
   * 角色ID
   *
   * @type {string}
   */
  public readonly id: string;

  /**
   * 角色名称
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 角色显示名称
   *
   * @type {string}
   */
  public readonly displayName: string;

  /**
   * 角色描述
   *
   * @type {string | null}
   */
  public readonly description: string | null;

  /**
   * 是否激活
   *
   * @type {boolean}
   */
  public readonly isActive: boolean;

  /**
   * 创建时间
   *
   * @type {Date}
   */
  public readonly createdAt: Date;

  /**
   * 更新时间
   *
   * @type {Date}
   */
  public readonly updatedAt: Date;

  /**
   * 构造函数
   *
   * 创建根据ID获取角色输出DTO实例。
   *
   * @param {object} params - 输出参数
   */
  constructor(params: {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.displayName = params.displayName;
    this.description = params.description;
    this.isActive = params.isActive;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
