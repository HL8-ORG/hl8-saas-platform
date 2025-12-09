/**
 * 创建租户输入DTO
 *
 * 用于创建新租户的输入参数。
 *
 * @class CreateTenantInputDto
 * @description 创建租户用例的输入DTO
 */
export class CreateTenantInputDto {
  /**
   * 租户名称
   *
   * 租户的显示名称，必须唯一。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 租户域名
   *
   * 租户的子域名，用于基于域名的租户识别（可选）。
   *
   * @type {string | undefined}
   */
  public readonly domain?: string;

  /**
   * 是否激活
   *
   * 标识租户是否处于激活状态。
   * 默认为 true。
   *
   * @type {boolean | undefined}
   */
  public readonly isActive?: boolean;

  /**
   * 构造函数
   *
   * 创建创建租户输入DTO实例。
   *
   * @param {object} params - 创建参数
   * @param {string} params.name - 租户名称
   * @param {string} [params.domain] - 租户域名
   * @param {boolean} [params.isActive=true] - 是否激活
   */
  constructor(params: { name: string; domain?: string; isActive?: boolean }) {
    this.name = params.name;
    this.domain = params.domain;
    this.isActive = params.isActive ?? true;
  }
}

/**
 * 创建租户输出DTO
 *
 * 创建租户用例的输出结果。
 *
 * @class CreateTenantOutputDto
 * @description 创建租户用例的输出DTO
 */
export class CreateTenantOutputDto {
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
   * 创建创建租户输出DTO实例。
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
