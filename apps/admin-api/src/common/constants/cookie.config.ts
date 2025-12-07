/**
 * Cookie 配置常量
 *
 * 定义 JWT 令牌 Cookie 的配置，包括名称和安全选项。
 *
 * **安全特性**：
 * - httpOnly: 防止 JavaScript 访问，防止 XSS 攻击
 * - secure: 生产环境启用，仅通过 HTTPS 传输
 * - sameSite: 防止 CSRF 攻击
 *   - 生产环境：'strict'（最严格）
 *   - 开发环境：'lax'（允许跨站 GET 请求）
 *
 * @constant {Object} COOKIE_CONFIG
 */
export const COOKIE_CONFIG = {
  /**
   * 访问令牌 Cookie 配置
   *
   * - 名称：'accessToken'
   * - 过期时间：1 小时
   */
  ACCESS_TOKEN: {
    name: 'accessToken',
    options: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  },
  /**
   * 刷新令牌 Cookie 配置
   *
   * - 名称：'refreshToken'
   * - 过期时间：30 天
   */
  REFRESH_TOKEN: {
    name: 'refreshToken',
    options: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },
} as const;
