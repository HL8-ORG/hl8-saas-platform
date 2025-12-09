/**
 * 获取用户列表输入DTO
 *
 * 用于查询用户列表的输入参数。
 *
 * @class GetUsersInputDto
 * @description 获取用户列表用例的输入DTO
 */
export class GetUsersInputDto {
  /**
   * 租户ID
   *
   * 当前租户的ID。
   *
   * @type {string}
   */
  public readonly tenantId: string;

  /**
   * 页码
   *
   * 分页查询的页码，从 1 开始。
   *
   * @type {number}
   */
  public readonly page: number;

  /**
   * 每页数量
   *
   * 每页返回的用户数量。
   *
   * @type {number}
   */
  public readonly limit: number;

  /**
   * 是否仅查询激活用户
   *
   * 如果为 true，只返回激活的用户。
   *
   * @type {boolean | undefined}
   */
  public readonly isActive?: boolean;

  /**
   * 搜索关键词
   *
   * 用于搜索用户邮箱或全名。
   *
   * @type {string | undefined}
   */
  public readonly search?: string;

  /**
   * 构造函数
   *
   * 创建获取用户列表输入DTO实例。
   *
   * @param {object} params - 查询参数
   * @param {string} params.tenantId - 租户ID
   * @param {number} [params.page=1] - 页码
   * @param {number} [params.limit=10] - 每页数量
   * @param {boolean} [params.isActive] - 是否仅查询激活用户
   * @param {string} [params.search] - 搜索关键词
   */
  constructor(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) {
    this.tenantId = params.tenantId;
    this.page = params.page ?? 1;
    this.limit = params.limit ?? 10;
    this.isActive = params.isActive;
    this.search = params.search;
  }
}
