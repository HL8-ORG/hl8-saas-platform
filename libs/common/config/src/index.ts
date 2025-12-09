import { RecordNamePaths } from '@hl8/utils';

import { AppConfig, appConfigToken, IAppConfig } from './lib/app.config';
import { CorsConfig, corsRegToken, ICorsConfig } from './lib/cors.config';
import {
  CryptoConfig,
  cryptoRegToken,
  ICryptoConfig,
} from './lib/crypto.config';
import { IRedisConfig, RedisConfig, redisRegToken } from './lib/redis.config';
import {
  ISecurityConfig,
  SecurityConfig,
  securityRegToken,
} from './lib/security.config';
import {
  IThrottlerConfig,
  ThrottlerConfig,
  throttlerConfigToken,
} from './lib/throttler.config';

export * from './lib/app.config';
export * from './lib/cors.config';
export * from './lib/crypto.config';
export * from './lib/redis.config';
export * from './lib/security.config';
export * from './lib/throttler.config';

/**
 * 所有配置类型接口
 *
 * @description 定义所有配置模块的类型映射，用于类型安全的配置访问
 */
export interface AllConfigType {
  [appConfigToken]: IAppConfig;
  [redisRegToken]: IRedisConfig;
  [securityRegToken]: ISecurityConfig;
  [throttlerConfigToken]: IThrottlerConfig;
  [corsRegToken]: ICorsConfig;
  [cryptoRegToken]: ICryptoConfig;
}

/**
 * 配置键路径类型
 *
 * @description 基于 AllConfigType 生成的配置键路径类型，用于类型安全的配置路径访问
 */
export type ConfigKeyPaths = RecordNamePaths<AllConfigType>;

/**
 * 默认导出配置对象
 *
 * @description 导出所有配置模块的默认对象，方便统一导入
 */
export default {
  AppConfig,
  RedisConfig,
  SecurityConfig,
  ThrottlerConfig,
  CorsConfig,
  CryptoConfig,
};
