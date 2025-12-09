import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvNumber, getEnvString } from '@hl8/utils';

/**
 * 安全配置注册令牌
 *
 * @description 用于标识安全配置的注册令牌
 */
export const securityRegToken = 'security';

/**
 * 安全配置
 *
 * @description 注册安全相关配置，包括 Casbin 模型、JWT 密钥和过期时间等
 *
 * @returns 返回安全配置对象
 *
 * @example
 * 环境变量配置：
 * - CASBIN_MODEL: Casbin 模型文件路径，默认 'model.conf'
 * - JWT_SECRET: JWT 密钥，默认 'JWT_SECRET-soybean-admin-nest!@#123.'
 * - JWT_EXPIRE_IN: JWT 过期时间（秒），默认 7200（2小时）
 * - REFRESH_TOKEN_SECRET: 刷新令牌密钥，默认 'REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.'
 * - REFRESH_TOKEN_EXPIRE_IN: 刷新令牌过期时间（秒），默认 43200（12小时）
 * - SIGN_REQ_TIMESTAMP_DISPARITY: 签名请求时间戳允许偏差（毫秒），默认 300000（5分钟）
 * - SIGN_REQ_NONCE_TTL: 签名请求随机数生存时间（秒），默认 300（5分钟）
 */
export const SecurityConfig = registerAs(securityRegToken, () => ({
  casbinModel: getEnvString('CASBIN_MODEL', 'model.conf'),
  jwtSecret: getEnvString('JWT_SECRET', 'JWT_SECRET-soybean-admin-nest!@#123.'),
  jwtExpiresIn: getEnvNumber('JWT_EXPIRE_IN', 60 * 60 * 2),
  refreshJwtSecret: getEnvString(
    'REFRESH_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET-soybean-admin-nest!@#123.',
  ),
  refreshJwtExpiresIn: getEnvNumber('REFRESH_TOKEN_EXPIRE_IN', 60 * 60 * 12),
  signReqTimestampDisparity: getEnvNumber(
    'SIGN_REQ_TIMESTAMP_DISPARITY',
    5 * 60 * 1000,
  ),
  signReqNonceTTL: getEnvNumber('SIGN_REQ_NONCE_TTL', 300),
}));

/**
 * 安全配置类型
 *
 * @description 安全配置对象的类型定义
 */
export type ISecurityConfig = ConfigType<typeof SecurityConfig>;
