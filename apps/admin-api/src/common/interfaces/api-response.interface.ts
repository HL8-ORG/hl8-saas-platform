/**
 * API 响应接口
 *
 * 定义统一的 API 响应格式。
 *
 * @template T - 响应数据的类型
 * @interface ApiResponse
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据（成功时） */
  data?: T;
  /** 错误信息（失败时） */
  error?: ApiError;
  /** 元数据（关联 ID、时间戳、分页信息等） */
  meta?: ApiMeta;
}

/**
 * API 错误接口
 *
 * 定义错误响应的结构。
 *
 * @interface ApiError
 */
export interface ApiError {
  /** 错误消息 */
  message: string;
  /** 错误代码 */
  code: string;
  /** 错误详情（可选） */
  details?: unknown;
}

/**
 * API 元数据接口
 *
 * 定义响应元数据的结构，包含时间戳、请求 ID、分页信息等。
 *
 * @interface ApiMeta
 */
export interface ApiMeta {
  /** 响应时间戳 */
  timestamp?: string;
  /** 请求 ID（关联 ID） */
  requestId?: string;
  /** 分页信息 */
  pagination?: PaginationMeta;
  /** 其他自定义元数据 */
  [key: string]: unknown;
}

/**
 * 分页元数据接口
 *
 * 定义分页响应的元数据结构。
 *
 * @interface PaginationMeta
 */
export interface PaginationMeta {
  /** 当前页码 */
  page: number;
  /** 每页数据限制 */
  limit: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
}
