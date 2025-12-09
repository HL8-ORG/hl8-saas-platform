/**
 * 根据ID获取租户输入DTO
 *
 * 用于根据ID查询租户的输入参数。
 *
 * @class GetTenantByIdInputDto
 * @description 根据ID获取租户用例的输入DTO
 */
export class GetTenantByIdInputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 构造函数
   *
   * 创建根据ID获取租户输入DTO实例。
   *
   * @param {object} params - 查询参数
   * @param {string} params.tenantId - 租户ID
   */
  constructor(params: { tenantId: string }) {
    this.tenantId = params.tenantId;
  }
}

/**
 * 根据ID获取租户输出DTO
 *
 * 根据ID获取租户用例的输出结果。
 *
 * @class GetTenantByIdOutputDto
 * @description 根据ID获取租户用例的输出DTO
 */
export class GetTenantByIdOutputDto {
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
   * 创建根据ID获取租户输出DTO实例。
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
