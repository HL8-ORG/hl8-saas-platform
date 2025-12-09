/**
 * 删除用户输出DTO
 *
 * 返回删除操作的结果。
 *
 * @class DeleteUserOutputDto
 * @description 删除用户用例的输出DTO
 */
export class DeleteUserOutputDto {
  /**
   * 成功消息
   *
   * @type {string}
   */
  public readonly message: string;

  /**
   * 构造函数
   *
   * 创建删除用户输出DTO实例。
   */
  constructor() {
    this.message = 'User deleted successfully';
  }
}
