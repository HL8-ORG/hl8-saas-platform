/**
 * 获取租户列表输入DTO
 *
 * 用于查询租户列表的输入参数。
 *
 * @class GetTenantsInputDto
 * @description 获取租户列表用例的输入DTO
 */
export class GetTenantsInputDto {
  /**
   * 构造函数
   *
   * 创建获取租户列表输入DTO实例。
   * 目前不需要任何参数，未来可以扩展（如分页、过滤等）。
   */
  constructor() {}
}

/**
 * 获取租户列表输出DTO
 *
 * 获取租户列表用例的输出结果。
 *
 * @class GetTenantsOutputDto
 * @description 获取租户列表用例的输出DTO
 */
export class GetTenantsOutputDto {
  /**
   * 租户列表
   *
   * @type {GetTenantOutputDto[]}
   */
  public readonly data: GetTenantOutputDto[];

  /**
   * 构造函数
   *
   * 创建获取租户列表输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {GetTenantOutputDto[]} params.data - 租户列表
   */
  constructor(params: { data: GetTenantOutputDto[] }) {
    this.data = params.data;
  }
}

/**
 * 获取租户输出DTO
 *
 * 单个租户的输出结果。
 *
 * @class GetTenantOutputDto
 * @description 获取租户用例的输出DTO
 */
export class GetTenantOutputDto {
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
   * 创建获取租户输出DTO实例。
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
