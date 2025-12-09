/**
 * 用户登录输入DTO
 *
 * 用户登录用例的输入参数。
 *
 * @class LoginInputDto
 * @description 用户登录用例输入DTO
 */
export class LoginInputDto {
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
   * 设备信息（可选）
   *
   * @type {string | undefined}
   */
  deviceInfo?: string;

  /**
   * IP地址（可选）
   *
   * @type {string | undefined}
   */
  ipAddress?: string;
}
