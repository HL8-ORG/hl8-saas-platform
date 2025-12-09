/**
 * 租户解析器接口
 *
 * 定义租户ID解析的服务接口，用于多租户场景。
 *
 * @interface ITenantResolver
 * @description 租户解析器接口
 */
export interface ITenantResolver {
  /**
   * 解析租户ID
   *
   * 从请求上下文或其他来源解析租户ID。
   *
   * @returns {Promise<string>} 租户ID
   * @throws {Error} 当无法解析租户ID时抛出异常
   */
  resolveTenantId(): Promise<string>;

  /**
   * 获取当前租户ID（同步）
   *
   * 从请求上下文中获取租户ID（适用于已有租户上下文的情况）。
   *
   * @returns {string} 租户ID
   * @throws {Error} 当租户上下文缺失时抛出异常
   */
  getCurrentTenantId(): string;
}
