/**
 * 删除租户输入DTO
 *
 * 用于删除租户的输入参数。
 *
 * @class DeleteTenantInputDto
 * @description 删除租户用例的输入DTO
 */
export class DeleteTenantInputDto {
  /**
   * 租户ID
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 构造函数
   *
   * 创建删除租户输入DTO实例。
   *
   * @param {object} params - 删除参数
   * @param {string} params.tenantId - 租户ID
   */
  constructor(params: { tenantId: string }) {
    this.tenantId = params.tenantId;
  }
}

/**
 * 删除租户输出DTO
 *
 * 删除租户用例的输出结果。
 *
 * @class DeleteTenantOutputDto
 * @description 删除租户用例的输出DTO
 */
export class DeleteTenantOutputDto {
  /**
   * 成功消息
   *
   * @type {string}
   */
  public readonly message: string;

  /**
   * 构造函数
   *
   * 创建删除租户输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {string} params.message - 成功消息
   */
  constructor(params: { message: string }) {
    this.message = params.message;
  }
}
