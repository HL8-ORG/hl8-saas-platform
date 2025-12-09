/**
 * 刷新令牌输入DTO
 *
 * 刷新访问令牌用例的输入参数。
 *
 * @class RefreshTokenInputDto
 * @description 刷新令牌用例输入DTO
 */
export class RefreshTokenInputDto {
  /**
   * 用户ID
   *
   * @type {string}
   */
  userId: string;

  /**
   * 刷新令牌
   *
   * @type {string}
   */
  refreshToken: string;

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
