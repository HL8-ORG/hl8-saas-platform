import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvNumber } from '@hl8/utils';

/**
 * 限流器配置注册令牌
 *
 * @description 用于标识限流器配置的注册令牌
 */
export const throttlerConfigToken = 'throttler';

/**
 * 限流器配置
 *
 * @description 注册限流器配置，控制 API 请求频率以防止滥用
 *
 * @returns 返回限流器配置对象
 *
 * @example
 * 环境变量配置：
 * - THROTTLER_TTL: 时间窗口（毫秒），默认 60000（1分钟）
 * - THROTTLER_LIMIT: 时间窗口内允许的最大请求数，默认 10
 *
 * @note 当请求超过限制时，会返回错误消息："Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly"
 */
export const ThrottlerConfig = registerAs(throttlerConfigToken, () => ({
  ttl: getEnvNumber('THROTTLER_TTL', 60000),
  limit: getEnvNumber('THROTTLER_LIMIT', 10),
  errorMessage:
    "Oops! Looks like you've hit our rate limit. Please take a short break and try again shortly",
}));

/**
 * 限流器配置类型
 *
 * @description 限流器配置对象的类型定义
 */
export type IThrottlerConfig = ConfigType<typeof ThrottlerConfig>;
