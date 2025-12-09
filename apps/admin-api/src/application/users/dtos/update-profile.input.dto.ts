import { UserId } from '../../../domain/shared/value-objects/user-id.vo';

/**
 * 更新个人资料输入DTO
 *
 * 用于更新当前用户个人资料的输入参数。
 *
 * @class UpdateProfileInputDto
 * @description 更新个人资料用例的输入DTO
 */
export class UpdateProfileInputDto {
  /**
   * 用户ID
   *
   * 当前登录用户的ID。
   *
   * @type {UserId}
   */
  public readonly userId: UserId;

  /**
   * 用户全名
   *
   * 用户的新全名，可选。
   *
   * @type {string | undefined}
   */
  public readonly fullName?: string;

  /**
   * 构造函数
   *
   * 创建更新个人资料输入DTO实例。
   *
   * @param {string} userId - 用户ID字符串
   * @param {object} data - 更新数据
   * @param {string} [data.fullName] - 新的全名
   */
  constructor(userId: string, data: { fullName?: string }) {
    this.userId = new UserId(userId);
    this.fullName = data.fullName;
  }
}
