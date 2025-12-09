/**
 * 用户注册输出DTO
 *
 * 用户注册用例的输出结果。
 *
 * @class SignupOutputDto
 * @description 用户注册用例输出DTO
 */
export class SignupOutputDto {
  /**
   * 用户ID
   *
   * @type {string}
   */
  userId: string;

  /**
   * 用户邮箱地址
   *
   * @type {string}
   */
  email: string;

  /**
   * 用户全名
   *
   * @type {string}
   */
  fullName: string;

  /**
   * 是否已激活
   *
   * @type {boolean}
   */
  isActive: boolean;

  /**
   * 邮箱是否已验证
   *
   * @type {boolean}
   */
  isEmailVerified: boolean;

  /**
   * 消息
   *
   * @type {string}
   */
  message: string;
}
