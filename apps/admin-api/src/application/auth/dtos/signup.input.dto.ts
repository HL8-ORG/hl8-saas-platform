/**
 * 用户注册输入DTO
 *
 * 用户注册用例的输入参数。
 *
 * @class SignupInputDto
 * @description 用户注册用例输入DTO
 */
export class SignupInputDto {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   */
  email: string;

  /**
   * 用户密码（明文）
   *
   * @type {string}
   */
  password: string;

  /**
   * 用户全名
   *
   * @type {string}
   */
  fullName: string;

  /**
   * 租户ID（可选，用于多租户场景）
   *
   * @type {string | undefined}
   */
  tenantId?: string;
}
