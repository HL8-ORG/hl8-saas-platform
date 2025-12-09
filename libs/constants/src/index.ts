/**
 * 常量模块统一导出
 *
 * @description 导出所有常量定义，包括 API Key 认证、缓存、事件、REST API 等相关常量
 *
 * @remarks
 * ## 导出的常量模块
 *
 * - **api-key.constant**: API Key 认证相关常量
 *   - `API_KEY_AUTH_OPTIONS`: API Key 认证选项元数据键
 *   - `ApiKeyAuthStrategy`: API Key 认证策略枚举（ApiKey, SignedRequest）
 *   - `ApiKeyAuthSource`: API Key 认证来源枚举（Header, Query）
 *
 * - **cache.constant**: 缓存相关常量
 *   - `CacheConstant`: 缓存前缀常量对象
 *     - `SYSTEM`: 系统级缓存前缀
 *     - `CACHE_PREFIX`: 通用缓存前缀
 *     - `AUTH_TOKEN_PREFIX`: 认证令牌缓存前缀
 *
 * - **event-emitter-token.constant**: 事件发射器事件名称常量
 *   - `EVENT_API_ROUTE_COLLECTED`: API 路由收集完成事件
 *   - `EVENT_OPERATION_LOG_CREATED`: 操作日志创建事件
 *   - `EVENT_API_KEY_VALIDATED`: API Key 验证完成事件
 *
 * - **rest.constant**: REST API 相关常量
 *   - `RESPONSE_SUCCESS_CODE`: 响应成功状态码 (200)
 *   - `RESPONSE_SUCCESS_MSG`: 响应成功消息 ('success')
 *   - `X_REQUEST_ID`: 请求 ID 请求头键名 ('x-request-id')
 *   - `USER_AGENT`: 用户代理请求头键名 ('user-agent')
 *   - `PATH`: 路径常量键名 ('path')
 *   - `FUNCTION`: 函数常量键名 ('function')
 *   - `METHOD`: HTTP 方法常量键名 ('method')
 *   - `SWAGGER_API_OPERATION`: Swagger API 操作元数据键 ('swagger/apiOperation')
 */

// API Key 认证相关常量
export * from './lib/api-key.constant';

// 缓存相关常量
export * from './lib/cache.constant';

// 事件发射器事件名称常量
export * from './lib/event-emitter-token.constant';

// REST API 相关常量
export * from './lib/rest.constant';
