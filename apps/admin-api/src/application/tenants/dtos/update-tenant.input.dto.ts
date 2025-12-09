/**
 * 更新租户输入DTO
 *
 * 用于更新租户信息的输入参数。
 *
 * @class UpdateTenantInputDto
 * @description 更新租户用例的输入DTO
 */
export class UpdateTenantInputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 租户名称
   *
   * 租户的显示名称，必须唯一。
   *
   * @type {string | undefined}
   */
  public readonly name?: string;

  /**
   * 租户域名
   *
   * 租户的子域名，用于基于域名的租户识别（可选）。
   *
   * @type {string | null | undefined}
   */
  public readonly domain?: string | null;

  /**
   * 是否激活
   *
   * 标识租户是否处于激活状态。
   *
   * @type {boolean | undefined}
   */
  public readonly isActive?: boolean;

  /**
   * 构造函数
   *
   * 创建更新租户输入DTO实例。
   *
   * @param {object} params - 更新参数
   * @param {string} params.tenantId - 租户ID
   * @param {string} [params.name] - 租户名称
   * @param {string | null} [params.domain] - 租户域名
   * @param {boolean} [params.isActive] - 是否激活
   */
  constructor(params: {
    tenantId: string;
    name?: string;
    domain?: string | null;
    isActive?: boolean;
  }) {
    this.tenantId = params.tenantId;
    this.name = params.name;
    this.domain = params.domain;
    this.isActive = params.isActive;
  }
}

/**
 * 更新租户输出DTO
 *
 * 更新租户用例的输出结果。
 *
 * @class UpdateTenantOutputDto
 * @description 更新租户用例的输出DTO
 */
export class UpdateTenantOutputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly id: string;

  /**
   * 租户名称
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 租户域名
   *
   * @type {string | null}
   */
  public readonly domain: string | null;

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
   * 创建更新租户输出DTO实例。
   *
   * @param {object} params - 输出参数
   */
  constructor(params: {
    id: string;
    name: string;
    domain: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.domain = params.domain;
    this.isActive = params.isActive;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
