import { UserId } from '../../../domain/shared/value-objects/user-id.vo';

/**
 * 获取个人资料输入DTO
 *
 * 用于获取当前用户个人资料的输入参数。
 *
 * @class GetProfileInputDto
 * @description 获取个人资料用例的输入DTO
 */
export class GetProfileInputDto {
  /**
   * 用户ID
   *
   * 当前登录用户的ID。
   *
   * @type {UserId}
   */
  public readonly userId: UserId;

  /**
   * 构造函数
   *
   * 创建获取个人资料输入DTO实例。
   *
   * @param {string} userId - 用户ID字符串
   */
  constructor(userId: string) {
    this.userId = new UserId(userId);
  }
}
