/**
 * 用户登出输入DTO
 *
 * 用户登出用例的输入参数。
 *
 * @class LogoutInputDto
 * @description 用户登出用例输入DTO
 */
export class LogoutInputDto {
  /**
   * 用户ID
   *
   * @type {string}
   */
  userId: string;

  /**
   * 刷新令牌（可选，用于单设备登出）
   *
   * @type {string | undefined}
   */
  refreshToken?: string;
}
