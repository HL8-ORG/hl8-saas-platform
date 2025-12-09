/**
 * 验证邮箱输出DTO
 *
 * 验证邮箱用例的输出结果。
 *
 * @class VerifyEmailOutputDto
 * @description 验证邮箱用例输出DTO
 */
export class VerifyEmailOutputDto {
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
   * 邮箱是否已验证
   *
   * @type {boolean}
   */
  isEmailVerified: boolean;

  /**
   * 成功消息
   *
   * @type {string}
   */
  message: string;
}
