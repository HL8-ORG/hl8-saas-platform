/**
 * JWT服务接口
 *
 * 定义JWT令牌生成和验证的服务接口。
 *
 * @interface IJwtService
 * @description JWT服务接口
 */
export interface IJwtService {
  /**
   * 生成访问令牌
   *
   * 根据载荷生成JWT访问令牌。
   *
   * @param {object} payload - JWT载荷
   * @returns {Promise<string>} 访问令牌
   */
  signAccessToken(payload: {
    sub: string;
    role: string;
    email: string;
    tenantId?: string;
  }): Promise<string>;

  /**
   * 生成刷新令牌
   *
   * 根据载荷生成JWT刷新令牌。
   *
   * @param {object} payload - JWT载荷
   * @returns {Promise<string>} 刷新令牌
   */
  signRefreshToken(payload: {
    sub: string;
    role: string;
    email: string;
    tenantId?: string;
  }): Promise<string>;
}
