import { ConfigType, registerAs } from '@nestjs/config';

import {
  getEnvArray,
  getEnvBoolean,
  getEnvNumber,
  getEnvString,
} from '@hl8/utils';

/**
 * CORS 配置注册令牌
 *
 * @description 用于标识 CORS 配置的注册令牌
 */
export const corsRegToken = 'cors';

/**
 * CORS 配置
 *
 * @description 注册跨域资源共享（CORS）配置，控制跨域请求的行为
 *
 * @returns 返回 CORS 配置对象
 *
 * @example
 * 环境变量配置：
 * - CORS_ENABLED: 是否启用 CORS，默认 false
 * - CORS_ORIGIN: 允许的源地址列表（数组）
 * - CORS_METHODS: 允许的 HTTP 方法，默认 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
 * - CORS_PREFLIGHT_CONTINUE: 是否继续处理预检请求，默认 false
 * - CORS_OPTIONS_SUCCESS_STATUS: 预检请求成功状态码，默认 204
 * - CORS_CREDENTIALS: 是否允许携带凭证，默认 true
 * - CORS_MAX_AGE: 预检请求缓存时间（秒），默认 3600
 */
export const CorsConfig = registerAs(corsRegToken, () => {
  return {
    enabled: getEnvBoolean('CORS_ENABLED', false),
    corsOptions: {
      origin: getEnvArray('CORS_ORIGIN'),
      methods: getEnvString(
        'CORS_METHODS',
        'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      ),
      preflightContinue: getEnvBoolean('CORS_PREFLIGHT_CONTINUE', false),
      optionsSuccessStatus: getEnvNumber('CORS_OPTIONS_SUCCESS_STATUS', 204),
      credentials: getEnvBoolean('CORS_CREDENTIALS', true),
      maxAge: getEnvNumber('CORS_MAX_AGE', 3600),
    },
  };
});

/**
 * CORS 配置类型
 *
 * @description CORS 配置对象的类型定义
 */
export type ICorsConfig = ConfigType<typeof CorsConfig>;
