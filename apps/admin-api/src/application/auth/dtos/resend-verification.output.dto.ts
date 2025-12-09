/**
 * 重发验证码输出DTO
 *
 * 重发验证码用例的输出结果。
 *
 * @class ResendVerificationOutputDto
 * @description 重发验证码用例输出DTO
 */
export class ResendVerificationOutputDto {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   */
  email: string;

  /**
   * 成功消息
   *
   * @type {string}
   */
  message: string;
}
