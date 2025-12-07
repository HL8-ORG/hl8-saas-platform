/// <reference types="vite/client" />

/**
 * Vite 环境变量类型定义
 * 为 TypeScript 提供环境变量的类型支持
 *
 * @remarks
 * 扩展 Vite 的默认 ImportMetaEnv 类型，添加自定义环境变量
 * 保留 Vite 内置属性：MODE, DEV, PROD, SSR 等
 */
interface ImportMetaEnv {
  /**
   * API 基础地址
   * 后端服务的基础 URL，例如：http://localhost:9528/api/v1
   */
  readonly VITE_API_BASE_URL: string

  /**
   * 应用环境
   * 可选值：development, production
   */
  readonly VITE_APP_ENV: 'development' | 'production'
}

// 扩展 ImportMeta 以包含 Vite 的内置环境变量
interface ImportMeta {
  readonly env: ImportMetaEnv & {
    /**
     * 当前模式（development/production）
     */
    readonly MODE: string
    /**
     * 是否为开发模式
     */
    readonly DEV: boolean
    /**
     * 是否为生产模式
     */
    readonly PROD: boolean
    /**
     * 是否为 SSR 模式
     */
    readonly SSR: boolean
  }
}
