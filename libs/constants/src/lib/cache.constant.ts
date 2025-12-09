/**
 * 缓存常量
 *
 * @description 定义缓存键的前缀常量，用于统一管理缓存键的命名空间
 *
 * @property SYSTEM - 系统级缓存前缀
 * @property CACHE_PREFIX - 通用缓存前缀
 * @property AUTH_TOKEN_PREFIX - 认证令牌缓存前缀
 */
export const CacheConstant = {
  /** 系统级缓存前缀 */
  SYSTEM: 'hl8:',
  /** 通用缓存前缀 */
  CACHE_PREFIX: 'hl8:cache:',
  /** 认证令牌缓存前缀 */
  AUTH_TOKEN_PREFIX: 'hl8:cache:user:',
  /** 邮箱验证码缓存前缀 */
  EMAIL_VERIFICATION_PREFIX: 'hl8:cache:email:verification:',
};
