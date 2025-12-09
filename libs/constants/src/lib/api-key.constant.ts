/**
 * API Key 认证选项元数据键
 *
 * @description 用于标识 API Key 认证选项的 Symbol 键
 */
export const API_KEY_AUTH_OPTIONS = Symbol('API_KEY_AUTH_OPTIONS');

/**
 * API Key 认证策略枚举
 *
 * @description 定义 API Key 认证的两种策略
 *
 * @enum ApiKeyAuthStrategy
 */
export enum ApiKeyAuthStrategy {
  /** 简单 API Key 认证策略 */
  ApiKey = 'api-key',
  /** 签名请求认证策略 */
  SignedRequest = 'signed-request',
}

/**
 * API Key 认证来源枚举
 *
 * @description 定义 API Key 可以从哪些位置获取
 *
 * @enum ApiKeyAuthSource
 */
export enum ApiKeyAuthSource {
  /** 从请求头获取 */
  Header = 'header',
  /** 从查询参数获取 */
  Query = 'query',
}
