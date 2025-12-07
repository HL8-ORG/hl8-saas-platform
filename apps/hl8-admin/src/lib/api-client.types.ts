/**
 * API 客户端类型定义
 *
 * 定义与后端 API 交互相关的 TypeScript 类型。
 * 包括响应格式、错误格式、请求配置和设备信息等类型定义。
 *
 * @module lib/api-client.types
 */

/**
 * 后端 API 标准响应格式
 *
 * 所有 API 响应都遵循此格式，包含消息和数据两部分。
 *
 * @template T - 响应数据的类型，默认为 unknown
 *
 * @example
 * ```ts
 * // 用户列表响应
 * const response: ApiResponse<User[]> = {
 *   message: '获取成功',
 *   data: [{ id: '1', name: 'John' }]
 * }
 *
 * // 单个用户响应
 * const userResponse: ApiResponse<User> = {
 *   message: '获取成功',
 *   data: { id: '1', name: 'John' }
 * }
 * ```
 */
export interface ApiResponse<T = unknown> {
  /**
   * 响应消息
   * 通常用于显示操作结果提示
   */
  message: string
  /**
   * 响应数据
   * 实际的业务数据，类型由泛型参数 T 指定
   */
  data: T
}

/**
 * 后端 API 错误响应格式
 *
 * 当请求失败时，后端返回的错误信息格式。
 * 支持新的统一响应格式和旧的兼容格式。
 *
 * @remarks
 * **新格式（统一响应格式）**：
 * - `success`: false
 * - `error`: { message, code, details }
 * - `meta`: { correlationId, timestamp }
 *
 * **旧格式（向后兼容）**：
 * - `statusCode`: HTTP 状态码
 * - `message`: 错误消息（字符串或数组）
 * - `errors`: 字段级别的验证错误
 * - `errorCode`: 业务错误码
 *
 * @example
 * ```ts
 * // 新格式
 * const error: ApiErrorResponse = {
 *   success: false,
 *   error: {
 *     message: '用户不存在',
 *     code: 'USER_NOT_FOUND',
 *     details: { userId: '123' }
 *   },
 *   meta: { correlationId: '...' }
 * }
 *
 * // 旧格式（兼容）
 * const oldError: ApiErrorResponse = {
 *   message: '验证失败',
 *   errors: {
 *     email: ['邮箱格式不正确']
 *   }
 * }
 * ```
 */
export interface ApiErrorResponse {
  /**
   * 请求是否成功（新格式）
   * 统一响应格式中的 success 字段，错误时为 false
   */
  success?: false
  /**
   * 错误信息（新格式）
   * 统一响应格式中的 error 对象
   */
  error?: {
    /**
     * 错误消息
     */
    message: string
    /**
     * 错误代码
     */
    code: string
    /**
     * 错误详情（可选）
     * 可能包含验证错误详情或其他附加信息
     */
    details?: unknown
  }
  /**
   * 元数据（新格式）
   * 统一响应格式中的 meta 对象
   */
  meta?: {
    /**
     * 关联 ID（用于日志追踪）
     */
    correlationId?: string
    /**
     * 时间戳
     */
    timestamp?: string
    [key: string]: unknown
  }
  /**
   * 错误状态码（旧格式，向后兼容）
   * HTTP 状态码，如 400、401、403、404、500 等
   */
  statusCode?: number
  /**
   * 错误消息（旧格式，向后兼容）
   * 可以是单个字符串或字符串数组
   * 当为数组时，通常显示第一个消息
   */
  message?: string | string[]
  /**
   * 错误标题（旧格式，向后兼容）
   * 部分错误响应可能包含标题，用于更详细的错误描述
   */
  title?: string
  /**
   * 错误详情（旧格式，向后兼容）
   * 字段级别的验证错误，键为字段名，值为错误消息数组
   * 通常在表单验证失败时使用
   */
  errors?: Record<string, string[]>
  /**
   * 错误码（旧格式，向后兼容）
   * 业务错误码，用于区分不同类型的业务错误
   */
  errorCode?: string
}

/**
 * API 客户端请求配置
 *
 * 扩展 axios 的请求配置，添加自定义配置选项。
 * 这些配置用于控制 API 客户端的行为。
 *
 * @remarks
 * 这些配置会通过模块声明合并到 axios 的 AxiosRequestConfig 中，
 * 因此可以在所有 axios 请求中使用。
 */
export interface ApiRequestConfig {
  /**
   * 是否跳过响应数据提取
   *
   * 默认情况下，API 客户端会自动提取 `response.data.data`。
   * 设置为 `true` 时，返回完整的响应对象（包括 `response.data`）。
   *
   * @default false
   *
   * @example
   * ```ts
   * // 默认行为：自动提取 data
   * const user = await apiClient.get('/users/1') // 返回 User 对象
   *
   * // 跳过提取：返回完整响应
   * const response = await apiClient.get('/users/1', {
   *   skipDataExtraction: true
   * }) // 返回 { message: string, data: User }
   * ```
   */
  skipDataExtraction?: boolean
  /**
   * 是否跳过错误处理
   *
   * 默认情况下，API 客户端会自动处理错误（显示错误提示等）。
   * 设置为 `true` 时，需要手动处理错误，不会自动显示错误提示。
   *
   * @default false
   *
   * @example
   * ```ts
   * // 默认行为：自动处理错误
   * try {
   *   await apiClient.get('/users/1')
   * } catch (error) {
   *   // 错误已自动处理，这里可以执行其他逻辑
   * }
   *
   * // 跳过错误处理：手动处理错误
   * try {
   *   await apiClient.get('/users/1', { skipErrorHandling: true })
   * } catch (error) {
   *   // 需要手动处理错误，不会自动显示提示
   *   console.error(error)
   * }
   * ```
   */
  skipErrorHandling?: boolean
}

/**
 * 扩展 AxiosRequestConfig 以支持自定义配置
 *
 * 通过 TypeScript 的模块声明合并（Module Augmentation），
 * 将 ApiRequestConfig 的属性合并到 axios 的 AxiosRequestConfig 中。
 * 这样可以在所有 axios 请求中使用自定义配置选项。
 */
declare module 'axios' {
  export interface AxiosRequestConfig extends ApiRequestConfig {}
}

/**
 * 设备信息接口
 *
 * 用于登录时追踪用户设备信息，增强安全性。
 * 这些信息会在登录请求中自动添加到请求体中。
 *
 * @remarks
 * 所有字段都是可选的，由 API 客户端自动检测和填充。
 * 主要用于安全审计和异常登录检测。
 *
 * @example
 * ```ts
 * const deviceInfo: DeviceInfo = {
 *   device_type: 'desktop',
 *   device_os: 'Windows',
 *   browser: 'Chrome',
 *   userAgent: 'Mozilla/5.0...'
 * }
 * ```
 */
export interface DeviceInfo {
  /**
   * IP 地址
   * 用户设备的 IP 地址（通常由后端获取）
   */
  ip?: string
  /**
   * 地理位置
   * 用户的地理位置信息（通常由后端根据 IP 获取）
   */
  location?: string
  /**
   * 设备名称
   * 设备标识名称，格式如 "Windows Chrome"
   */
  device_name?: string
  /**
   * 设备操作系统
   * 如 "Windows"、"macOS"、"Linux"、"Android"、"iOS" 等
   */
  device_os?: string
  /**
   * 设备类型
   * - 'mobile': 移动设备
   * - 'tablet': 平板设备
   * - 'desktop': 桌面设备
   */
  device_type?: string
  /**
   * 浏览器名称
   * 如 "Chrome"、"Firefox"、"Safari"、"Edge" 等
   */
  browser?: string
  /**
   * 用户代理字符串
   * 完整的 User-Agent 字符串
   */
  userAgent?: string
}
