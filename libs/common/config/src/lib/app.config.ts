import { ConfigType, registerAs } from '@nestjs/config';

import { getEnvBoolean, getEnvNumber, getEnvString } from '@hl8/utils';

/**
 * 应用配置注册令牌
 *
 * @description 用于标识应用配置的注册令牌
 */
export const appConfigToken = 'app';

/**
 * 应用配置
 *
 * @description 注册应用基础配置，包括端口、Swagger 文档等
 *
 * @returns 返回应用配置对象
 *
 * @example
 * 环境变量配置：
 * - APP_PORT: 应用端口，默认 9528
 * - DOC_SWAGGER_ENABLE: 是否启用 Swagger 文档，默认 true
 * - DOC_SWAGGER_PATH: Swagger 文档路径，默认 api-docs
 */
export const AppConfig = registerAs(appConfigToken, () => ({
  port: getEnvNumber('APP_PORT', 9528),
  docSwaggerEnable: getEnvBoolean('DOC_SWAGGER_ENABLE', true),
  docSwaggerPath: getEnvString('DOC_SWAGGER_PATH', 'api-docs'),
}));

/**
 * 应用配置类型
 *
 * @description 应用配置对象的类型定义
 */
export type IAppConfig = ConfigType<typeof AppConfig>;
