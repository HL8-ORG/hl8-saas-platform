/**
 * 刷新令牌输出DTO
 *
 * 刷新访问令牌用例的输出结果。
 *
 * @class RefreshTokenOutputDto
 * @description 刷新令牌用例输出DTO
 */
export class RefreshTokenOutputDto {
  /**
   * 访问令牌
   *
   * @type {string}
   */
  accessToken: string;

  /**
   * 刷新令牌
   *
   * @type {string}
   */
  refreshToken: string;
}
