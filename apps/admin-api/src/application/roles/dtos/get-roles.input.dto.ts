/**
 * 获取角色列表输入DTO
 *
 * 用于查询角色列表的输入参数。
 *
 * @class GetRolesInputDto
 * @description 获取角色列表用例的输入DTO
 */
export class GetRolesInputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 构造函数
   *
   * 创建获取角色列表输入DTO实例。
   *
   * @param {object} params - 查询参数
   * @param {string} params.tenantId - 租户ID
   */
  constructor(params: { tenantId: string }) {
    this.tenantId = params.tenantId;
  }
}

/**
 * 获取角色列表输出DTO
 *
 * 获取角色列表用例的输出结果。
 *
 * @class GetRolesOutputDto
 * @description 获取角色列表用例的输出DTO
 */
export class GetRolesOutputDto {
  /**
   * 角色列表
   *
   * @type {GetRoleOutputDto[]}
   */
  public readonly data: GetRoleOutputDto[];

  /**
   * 构造函数
   *
   * 创建获取角色列表输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {GetRoleOutputDto[]} params.data - 角色列表
   */
  constructor(params: { data: GetRoleOutputDto[] }) {
    this.data = params.data;
  }
}

/**
 * 获取角色输出DTO
 *
 * 单个角色的输出结果。
 *
 * @class GetRoleOutputDto
 * @description 获取角色用例的输出DTO
 */
export class GetRoleOutputDto {
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
   * 创建获取角色输出DTO实例。
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
