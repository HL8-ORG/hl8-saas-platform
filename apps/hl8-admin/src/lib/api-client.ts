import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import type { ApiErrorResponse, ApiRequestConfig } from './api-client.types'
import { authService } from './services/auth.service'

/**
 * 获取设备信息
 * 从浏览器 navigator 对象中提取设备相关信息
 *
 * @returns 设备信息对象
 */
function getDeviceInfo() {
  const ua = navigator.userAgent

  // 检测设备类型
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  const isTablet = /iPad|Android/i.test(ua) && !isMobile
  let deviceType = 'desktop'
  if (isMobile) deviceType = 'mobile'
  else if (isTablet) deviceType = 'tablet'

  // 检测浏览器
  let browser = 'unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'

  // 检测操作系统
  let deviceOs = 'unknown'
  if (ua.includes('Windows')) deviceOs = 'Windows'
  else if (ua.includes('Mac')) deviceOs = 'macOS'
  else if (ua.includes('Linux')) deviceOs = 'Linux'
  else if (ua.includes('Android')) deviceOs = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    deviceOs = 'iOS'

  return {
    device_type: deviceType,
    device_os: deviceOs,
    browser,
    userAgent: ua,
    device_name: `${deviceOs} ${browser}`,
  }
}

/**
 * 是否正在刷新令牌
 * 用于防止并发刷新请求
 */
let isRefreshing = false

/**
 * 待重试的请求队列
 * 在令牌刷新完成后重试这些请求
 */
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (error?: unknown) => void
}> = []

/**
 * 处理待重试的请求队列
 */
function processQueue(error: unknown | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

/**
 * 修复 API 基础地址
 * 确保 baseURL 包含 /api/v1 前缀
 *
 * @param url - 原始 URL
 * @returns 修复后的 URL
 */
function fixBaseURL(url: string | undefined): string {
  const defaultURL = 'http://localhost:9528/api/v1'

  if (!url) {
    return defaultURL
  }

  // 如果已经包含 /api/v1，直接返回
  if (url.includes('/api/v1')) {
    return url
  }

  // 如果以 /v1 结尾，替换为 /api/v1
  if (url.endsWith('/v1')) {
    return url.replace(/\/v1$/, '/api/v1')
  }

  // 如果以 /v1/ 结尾，替换为 /api/v1/
  if (url.endsWith('/v1/')) {
    return url.replace(/\/v1\/$/, '/api/v1/')
  }

  // 其他情况，确保以 /api/v1 结尾
  return url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`
}

/**
 * 创建并配置 axios 实例
 * 配置基础 URL、超时时间、请求/响应拦截器等
 */
const apiClient: AxiosInstance = axios.create({
  /**
   * API 基础地址
   * 从环境变量读取，如果未设置则使用默认值
   * 自动修复路径，确保包含 /api/v1 前缀
   * 后端全局前缀为 /api/v1，默认端口为 9528
   * 完整路径格式：http://localhost:<后端端口>/api/v1
   */
  baseURL: fixBaseURL(import.meta.env.VITE_API_BASE_URL),
  /**
   * 请求超时时间（毫秒）
   */
  timeout: 30000,
  /**
   * 是否携带凭证（Cookie）
   * 后端使用 HttpOnly Cookie 存储 Token，必须启用 withCredentials 才能正常传输 Cookie
   * 注意：当 withCredentials 为 true 时，CORS 配置必须允许 credentials
   */
  withCredentials: true,
  /**
   * 默认请求头
   */
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/**
 * 请求拦截器
 * 在发送请求前自动添加设备信息
 *
 * @remarks
 * 后端使用 HttpOnly Cookie 存储 Token，所有请求会自动携带 Cookie
 * 无需手动设置 Authorization header
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 注意：后端使用 HttpOnly Cookie 存储 Token，所有请求会自动携带 Cookie
    // 无需手动设置 Authorization header

    // 注意：后端从请求头（user-agent）获取设备信息，不需要在请求体中添加
    // 设备信息会自动通过浏览器的 user-agent 请求头发送

    // 开发环境下输出请求信息以便调试
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers,
      })
    }

    return config
  },
  (error) => {
    // 请求错误处理
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 * 统一处理响应数据格式和错误，实现自动令牌刷新
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 获取请求配置
    const config = response.config as AxiosRequestConfig & ApiRequestConfig

    // 如果设置了跳过数据提取，返回完整响应
    if (config.skipDataExtraction) {
      return response
    }

    // 适配后端统一响应格式：{ success: true, data: T, meta: {...} }
    // 提取 response.data.data 字段
    if (
      response.data &&
      typeof response.data === 'object' &&
      'success' in response.data &&
      'data' in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      }
    }

    // 兼容旧格式：{ message: string, data: T }
    if (response.data && 'data' in response.data) {
      return {
        ...response,
        data: response.data.data,
      }
    }

    // 如果没有 data 字段，返回原始响应
    return response
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    // 获取请求配置
    const config = error.config as AxiosRequestConfig & ApiRequestConfig

    // 如果设置了跳过错误处理，直接返回错误
    if (config.skipErrorHandling) {
      return Promise.reject(error)
    }

    // 处理 401 未授权错误（自动刷新令牌）
    if (error.response?.status === 401) {
      const originalRequest = config

      // 如果已经在刷新令牌，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => {
            // 重试原始请求（后端 Cookie 自动处理认证）
            return apiClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      // 开始刷新令牌
      isRefreshing = true

      const authState = useAuthStore.getState().auth
      const { user } = authState

      // 检查是否有用户信息（Token 由后端 Cookie 管理，前端无法直接检查）
      if (!user) {
        // 没有用户信息，清除状态并跳转登录页
        authState.reset()
        processQueue(new Error('未授权，请重新登录'))
        isRefreshing = false

        // 跳转到登录页（需要延迟以避免在拦截器中直接导航）
        setTimeout(() => {
          window.location.href = '/sign-in'
        }, 100)

        return Promise.reject(error)
      }

      try {
        // 调用刷新令牌 API
        // 后端从 HttpOnly Cookie 中自动读取 refreshToken，无需传递参数
        await authService.refreshToken()

        // 注意：后端已自动更新 Cookie，无需手动设置 Token
        // 所有后续请求会自动携带新的 Cookie

        // 处理队列中的请求
        processQueue(null)
        isRefreshing = false

        // 重试原始请求（后端 Cookie 自动处理认证）
        return apiClient(originalRequest)
      } catch (refreshError) {
        // 刷新令牌失败，清除状态
        authState.reset()
        processQueue(refreshError)
        isRefreshing = false

        // 跳转到登录页
        setTimeout(() => {
          window.location.href = '/sign-in'
        }, 100)

        return Promise.reject(refreshError)
      }
    }

    // 处理其他类型的错误
    if (error.response) {
      // 服务器返回了错误响应
      // 由全局错误处理器统一处理
    } else if (error.request) {
      // 请求已发送但没有收到响应
      // 可能是网络错误、服务器无响应或 CORS 问题
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

      const requestUrl = error.config?.url
        ? `${configBaseURL}${error.config.url}`
        : baseURL

      // 开发环境下输出详细错误信息
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('API Request Failed:', {
          url: requestUrl,
          method: error.config?.method?.toUpperCase(),
          baseURL: error.config?.baseURL,
          error: error.message,
          request: error.request,
          frontendOrigin: window.location.origin,
        })
      }

      error.message = `网络错误：无法连接到服务器 ${requestUrl}。请检查：
1. 后端服务是否已启动（${baseURL}）
2. CORS 配置是否正确（允许来源：${window.location.origin}）
3. 网络连接是否正常`
    } else {
      // 请求配置错误
      error.message = '请求配置错误'
    }

    return Promise.reject(error)
  }
)

/**
 * 导出配置好的 axios 实例
 * 在应用中使用此实例进行所有 API 调用
 *
 * @example
 * ```ts
 * import { apiClient } from '@/lib/api-client'
 *
 * // GET 请求
 * const users = await apiClient.get('/users')
 *
 * // POST 请求
 * const result = await apiClient.post('/auth/sign-in', { email, password })
 * ```
 */
export { apiClient }

/**
 * 导出设备信息获取函数（供外部使用）
 */
export { getDeviceInfo }
