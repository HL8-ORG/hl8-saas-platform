/**
 * 邮件配置接口。
 *
 * @description 定义邮件服务所需的配置项。
 * 使用方需要提供包含 MAIL_USERNAME 的配置对象。
 * APP_NAME 和 APP_URL 为可选字段，用于邮件模板中的品牌信息。
 */
export interface MailConfig {
  /**
   * 邮件用户名（发件人邮箱地址）。
   */
  readonly MAIL_USERNAME: string;

  /**
   * 应用名称。
   *
   * @description 用于邮件模板中显示应用名称，如果未提供则使用默认值 'HL8 Platform'。
   */
  readonly APP_NAME?: string;

  /**
   * 应用 URL。
   *
   * @description 用于邮件模板中的链接和资源引用，如果未提供则使用默认值 'https://example.com'。
   */
  readonly APP_URL?: string;
}

/**
 * MailConfig 注入 token。
 *
 * @description 用于依赖注入的 token。
 */
export const MAIL_CONFIG = Symbol('MAIL_CONFIG');
