import { AxiosError } from 'axios'
import { toast } from 'sonner'
import type { ApiErrorResponse } from './api-client.types'

/**
 * 处理服务器错误
 * 统一处理应用中的服务器错误，提取错误信息并显示给用户
 *
 * @param error - 未知类型的错误对象，可能是 AxiosError 或其他错误类型
 *
 * @remarks
 * 错误处理逻辑：
 * 1. 首先检查是否为状态码 204（内容未找到）
 * 2. 如果是 AxiosError，根据不同的 HTTP 状态码提取相应的错误信息
 * 3. 适配后端错误响应格式（ApiErrorResponse）
 * 4. 如果无法提取具体错误信息，使用默认错误消息
 * 5. 使用 toast 显示错误消息给用户
 *
 * 支持的错误状态码：
 * - 400: 验证错误，显示后端返回的详细错误信息
 * - 401: 未授权，显示会话过期消息
 * - 403: 权限不足，显示权限错误消息
 * - 404: 资源不存在，显示未找到消息
 * - 500: 服务器错误，显示服务器错误消息
 * - 其他: 显示通用错误消息
 *
 * @example
 * ```ts
 * try {
 *   await apiClient.get('/users')
 * } catch (error) {
 *   handleServerError(error)
 * }
 * ```
 */
export function handleServerError(error: unknown) {
  // eslint-disable-next-line no-console
  console.log(error)

  let errMsg = '出错了！'

  // 处理非 AxiosError 的错误
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = '内容未找到。'
    toast.error(errMsg)
    return
  }

  // 处理普通的 Error 对象（非 AxiosError）
  if (error instanceof Error && !(error instanceof AxiosError)) {
    errMsg = error.message || '出错了！'
    toast.error(errMsg)
    return
  }

  // 处理 AxiosError
  if (error instanceof AxiosError) {
    const response = error.response
    const errorData = response?.data as ApiErrorResponse | undefined

    if (response) {
      const status = response.status

      // 开发环境下输出详细错误信息用于调试
      if (import.meta.env.DEV && (status === 400 || status === 422)) {
        // eslint-disable-next-line no-console
        console.log('验证错误详情:', {
          status,
          errorData,
          responseData: response.data,
          hasErrors: !!errorData?.errors,
          hasNewFormat: !!errorData?.error,
          errorsKeys: errorData?.errors ? Object.keys(errorData.errors) : [],
          errorsValue: errorData?.errors,
        })
      }

      // 优先处理新格式（统一响应格式）
      if (errorData?.error) {
        const errorInfo = errorData.error
        errMsg = errorInfo.message || '出错了！'

        // 如果有错误代码，在开发环境显示
        if (import.meta.env.DEV && errorInfo.code) {
          // eslint-disable-next-line no-console
          console.log('错误代码:', errorInfo.code)
        }

        // 处理 details 字段（可能包含验证错误详情）
        if (errorInfo.details) {
          if (
            typeof errorInfo.details === 'object' &&
            errorInfo.details !== null
          ) {
            const details = errorInfo.details as Record<string, unknown>
            // 检查是否是验证错误详情
            if (
              details.validationErrors &&
              Array.isArray(details.validationErrors)
            ) {
              const validationErrors = details.validationErrors as string[]
              if (validationErrors.length > 0) {
                errMsg = validationErrors[0]
              }
            }
          }
        }

        toast.error(errMsg)
        return
      }

      switch (status) {
        case 400:
        case 422:
          // 验证错误（400 Bad Request 或 422 Unprocessable Entity）
          // 处理旧格式（向后兼容）
          if (errorData) {
            // 处理字段级别的验证错误
            // 检查 errors 字段是否存在且不为空
            if (errorData.errors) {
              const errorKeys = Object.keys(errorData.errors)
              if (errorKeys.length > 0) {
                const errorEntries = Object.entries(errorData.errors)
                // 提取所有验证错误，组合成更详细的错误消息
                const errorMessages = errorEntries
                  .map(([field, messages]) => {
                    // 处理不同的错误格式
                    let msg: string
                    if (Array.isArray(messages)) {
                      msg = messages[0] || '验证失败'
                    } else if (
                      typeof messages === 'object' &&
                      messages !== null
                    ) {
                      // 处理嵌套对象，递归提取所有错误消息
                      const extractMessages = (obj: unknown): string[] => {
                        if (Array.isArray(obj)) {
                          return obj.filter((item) => typeof item === 'string')
                        }
                        if (typeof obj === 'object' && obj !== null) {
                          const values = Object.values(obj)
                          return values.flatMap((val) => extractMessages(val))
                        }
                        return []
                      }
                      const allMessages = extractMessages(messages)
                      msg = allMessages[0] || '验证失败'
                    } else {
                      msg = String(messages || '验证失败')
                    }
                    return `${field}: ${msg}`
                  })
                  .filter((msg) => msg.length > 0 && !msg.includes('验证失败'))
                  .join('; ')
                errMsg = errorMessages || '请求参数验证失败'
              } else {
                // errors 对象存在但为空，检查是否有其他错误信息
                // 可能是错误格式不同，尝试从整个 errorData 中提取
                const allKeys = Object.keys(errorData)
                const errorInfoKeys = allKeys.filter(
                  (key) =>
                    key !== 'message' &&
                    key !== 'statusCode' &&
                    key !== 'errors'
                )
                if (errorInfoKeys.length > 0) {
                  // 尝试从其他字段提取错误信息
                  const errorInfo = errorInfoKeys
                    .map((key) => {
                      const value = errorData[key as keyof typeof errorData]
                      if (typeof value === 'string') {
                        return value
                      }
                      if (Array.isArray(value) && value.length > 0) {
                        return value[0]
                      }
                      return null
                    })
                    .filter((v) => v !== null)
                    .join('; ')
                  errMsg = errorInfo || '请求参数验证失败，请检查表单字段'
                } else {
                  errMsg = '请求参数验证失败，请检查表单字段'
                }
              }
            } else if (errorData.message) {
              // 如果只有 message 字段，检查是否是 "Validation failed"
              // 如果是，尝试从其他地方提取错误信息
              const message = Array.isArray(errorData.message)
                ? errorData.message[0]
                : errorData.message

              // 如果消息是 "Validation failed"，尝试查找其他错误信息
              if (
                message === 'Validation failed' ||
                message === 'validation failed'
              ) {
                // 检查是否有其他字段包含错误信息
                const errorKeys = Object.keys(errorData).filter(
                  (key) => key !== 'message' && key !== 'statusCode'
                )
                if (errorKeys.length > 0) {
                  // 尝试从其他字段提取错误信息
                  const firstKey = errorKeys[0]
                  const firstValue =
                    errorData[firstKey as keyof typeof errorData]
                  if (typeof firstValue === 'string') {
                    errMsg = firstValue
                  } else if (
                    Array.isArray(firstValue) &&
                    firstValue.length > 0
                  ) {
                    errMsg = firstValue[0]
                  } else {
                    errMsg = '请求参数验证失败，请检查表单字段'
                  }
                } else {
                  errMsg = '请求参数验证失败，请检查表单字段'
                }
              } else {
                errMsg = message
              }
            } else if (errorData.title) {
              errMsg = errorData.title
            } else {
              errMsg = '请求参数错误'
            }
          } else {
            errMsg = '请求参数错误'
          }
          break

        case 401:
          // 未授权（会话过期）
          // 优先使用新格式，兼容旧格式
          if (errorData?.error?.message) {
            errMsg = errorData.error.message
          } else if (errorData?.message) {
            errMsg = Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
          } else {
            errMsg = '会话已过期，请重新登录'
          }
          break

        case 403:
          // 权限不足
          // 优先使用新格式，兼容旧格式
          if (errorData?.error?.message) {
            errMsg = errorData.error.message
          } else if (errorData?.message) {
            errMsg = Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
          } else {
            errMsg = '权限不足，无法执行此操作'
          }
          break

        case 404:
          // 资源不存在
          // 优先使用新格式，兼容旧格式
          if (errorData?.error?.message) {
            errMsg = errorData.error.message
          } else if (errorData?.message) {
            errMsg = Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
          } else {
            errMsg = '请求的资源不存在'
          }
          break

        case 500:
          // 服务器内部错误
          // 优先使用新格式，兼容旧格式
          if (errorData?.error?.message) {
            errMsg = errorData.error.message
          } else if (errorData?.message) {
            errMsg = Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
          } else {
            errMsg = '服务器内部错误，请稍后重试'
          }
          break

        default:
          // 其他错误
          // 优先使用新格式，兼容旧格式
          if (errorData?.error?.message) {
            errMsg = errorData.error.message
          } else if (errorData?.message) {
            errMsg = Array.isArray(errorData.message)
              ? errorData.message[0]
              : errorData.message
          } else if (errorData?.title) {
            errMsg = errorData.title
          } else {
            errMsg = `请求失败（状态码：${status}）`
          }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应（网络错误）
      // 可能是后端服务未启动、CORS 配置错误或网络问题
      // 使用正确的默认 baseURL（包含 /api/v1 前缀）
      const defaultBaseURL = 'http://localhost:9528/api/v1'
      const envBaseURL = import.meta.env.VITE_API_BASE_URL
      // 如果环境变量设置了但缺少 /api 前缀，自动修复
      const baseURL = envBaseURL
        ? envBaseURL.includes('/api/v1')
          ? envBaseURL
          : envBaseURL.replace(/\/v1$/, '/api/v1') || defaultBaseURL
        : defaultBaseURL

      // 修复 error.config.baseURL（如果存在但路径错误）
      const configBaseURL = error.config?.baseURL
        ? error.config.baseURL.includes('/api/v1')
          ? error.config.baseURL
          : error.config.baseURL.replace(/\/v1$/, '/api/v1')
        : baseURL

      const requestURL = error.config?.url
        ? `${configBaseURL}${error.config.url}`
        : baseURL

      // 开发环境下输出详细错误信息
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('网络错误详情:', {
          error,
          request: error.request,
          config: error.config,
          baseURL,
          requestURL,
          status: error.response?.status,
          response: error.response,
        })
      }

      errMsg = `网络错误，无法连接到服务器。请检查：
1. 后端服务是否已启动（${baseURL}）
2. 网络连接是否正常
3. CORS 配置是否正确
4. 请求地址：${requestURL}`
    } else {
      // 请求配置错误
      errMsg = error.message || '请求配置错误'
    }
  }

  toast.error(errMsg)
}
