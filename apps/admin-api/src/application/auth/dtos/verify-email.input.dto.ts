/**
 * 验证邮箱输入DTO
 *
 * 验证邮箱用例的输入参数。
 *
 * @class VerifyEmailInputDto
 * @description 验证邮箱用例输入DTO
 */
export class VerifyEmailInputDto {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   */
  email: string;

  /**
   * 邮箱验证码
   *
   * @type {string}
   */
  code: string;
}
