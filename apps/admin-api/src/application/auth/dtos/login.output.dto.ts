/**
 * 用户登录输出DTO
 *
 * 用户登录用例的输出结果。
 *
 * @class LoginOutputDto
 * @description 用户登录用例输出DTO
 */
export class LoginOutputDto {
  /**
   * 用户信息
   *
   * @type {object}
   */
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };

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
