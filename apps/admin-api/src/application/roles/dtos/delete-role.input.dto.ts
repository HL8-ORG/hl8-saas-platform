/**
 * 删除角色输入DTO
 *
 * 用于删除角色的输入参数。
 *
 * @class DeleteRoleInputDto
 * @description 删除角色用例的输入DTO
 */
export class DeleteRoleInputDto {
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
   * 创建删除角色输入DTO实例。
   *
   * @param {object} params - 删除参数
   * @param {string} params.roleId - 角色ID
   * @param {string} params.tenantId - 租户ID
   */
  constructor(params: { roleId: string; tenantId: string }) {
    this.roleId = params.roleId;
    this.tenantId = params.tenantId;
  }
}

/**
 * 删除角色输出DTO
 *
 * 删除角色用例的输出结果。
 *
 * @class DeleteRoleOutputDto
 * @description 删除角色用例的输出DTO
 */
export class DeleteRoleOutputDto {
  /**
   * 成功消息
   *
   * @type {string}
   */
  public readonly message: string;

  /**
   * 构造函数
   *
   * 创建删除角色输出DTO实例。
   *
   * @param {object} params - 输出参数
   * @param {string} params.message - 成功消息
   */
  constructor(params: { message: string }) {
    this.message = params.message;
  }
}
