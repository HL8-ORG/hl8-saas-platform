/**
 * 创建角色输入DTO
 *
 * 用于创建新角色的输入参数。
 *
 * @class CreateRoleInputDto
 * @description 创建角色用例的输入DTO
 */
export class CreateRoleInputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 角色名称
   *
   * 角色的唯一标识名称，用于 Casbin 策略中的角色定义。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 角色显示名称
   *
   * 角色的友好显示名称，用于用户界面展示。
   * 可选，如果不提供则使用 name。
   *
   * @type {string | undefined}
   */
  public readonly displayName?: string;

  /**
   * 角色描述
   *
   * 角色的详细描述，说明角色的用途和权限范围。
   *
   * @type {string | undefined}
   */
  public readonly description?: string;

  /**
   * 是否激活
   *
   * 标识角色是否处于激活状态。
   * 默认为 true。
   *
   * @type {boolean | undefined}
   */
  public readonly isActive?: boolean;

  /**
   * 构造函数
   *
   * 创建创建角色输入DTO实例。
   *
   * @param {object} params - 创建参数
   * @param {string} params.tenantId - 租户ID
   * @param {string} params.name - 角色名称
   * @param {string} [params.displayName] - 显示名称
   * @param {string} [params.description] - 描述
   * @param {boolean} [params.isActive=true] - 是否激活
   */
  constructor(params: {
    tenantId: string;
    name: string;
    displayName?: string;
    description?: string;
    isActive?: boolean;
  }) {
    this.tenantId = params.tenantId;
    this.name = params.name;
    this.displayName = params.displayName;
    this.description = params.description;
    this.isActive = params.isActive ?? true;
  }
}

/**
 * 创建角色输出DTO
 *
 * 创建角色用例的输出结果。
 *
 * @class CreateRoleOutputDto
 * @description 创建角色用例的输出DTO
 */
export class CreateRoleOutputDto {
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
   * 创建创建角色输出DTO实例。
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
