/**
 * 刷新令牌仓储接口
 *
 * 定义刷新令牌的持久化操作接口。
 * 此接口用于应用层，不暴露给领域层。
 *
 * @interface IRefreshTokenRepository
 * @description 刷新令牌仓储接口（应用层）
 */
export interface IRefreshTokenRepository {
  /**
   * 创建刷新令牌
   *
   * 创建新的刷新令牌记录。
   *
   * @param {object} data - 刷新令牌数据
   * @returns {Promise<object>} 创建的刷新令牌
   */
  create(data: {
    token: string;
    userId: string;
    tenantId: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<{
    id: string;
    token: string;
    userId: string;
    tenantId: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;

  /**
   * 查找有效令牌
   *
   * 查找用户的有效（未过期）刷新令牌列表。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Array>} 刷新令牌列表
   */
  findValidTokens(
    userId: string,
    tenantId: string,
  ): Promise<
    Array<{
      id: string;
      token: string;
      expiresAt: Date;
    }>
  >;

  /**
   * 查找所有令牌
   *
   * 查找用户的所有刷新令牌（包括已过期的）。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Array>} 刷新令牌列表
   */
  findAllTokens(
    userId: string,
    tenantId: string,
  ): Promise<
    Array<{
      id: string;
      token: string;
      expiresAt: Date;
    }>
  >;

  /**
   * 验证并查找令牌
   *
   * 通过明文令牌验证并查找匹配的刷新令牌。
   * 使用bcrypt比较来验证令牌哈希。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @param {string} plainToken - 明文刷新令牌
   * @returns {Promise<string | null>} 如果找到匹配的令牌返回令牌ID，否则返回null
   */
  findAndVerifyToken(
    userId: string,
    tenantId: string,
    plainToken: string,
  ): Promise<string | null>;

  /**
   * 更新刷新令牌
   *
   * 更新指定刷新令牌的信息。
   *
   * @param {string} tokenId - 令牌ID
   * @param {object} data - 更新的数据
   * @returns {Promise<void>}
   */
  update(
    tokenId: string,
    data: {
      token?: string;
      deviceInfo?: string;
      ipAddress?: string;
      expiresAt?: Date;
    },
  ): Promise<void>;

  /**
   * 删除刷新令牌
   *
   * 删除指定的刷新令牌。
   *
   * @param {string} tokenId - 令牌ID
   * @returns {Promise<void>}
   */
  delete(tokenId: string): Promise<void>;

  /**
   * 删除用户所有令牌
   *
   * 删除指定用户的所有刷新令牌。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<void>}
   */
  deleteAll(userId: string, tenantId: string): Promise<void>;

  /**
   * 清理过期令牌
   *
   * 删除指定用户的过期刷新令牌。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<void>}
   */
  cleanupExpired(userId: string, tenantId: string): Promise<void>;
}
