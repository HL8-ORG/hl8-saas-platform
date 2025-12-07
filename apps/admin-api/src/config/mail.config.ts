import type { MailConfig } from '@hl8/mail';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 邮件配置实现类
 *
 * 实现 MailConfig 接口，从环境变量中读取邮件配置。
 * 用于 @hl8/mail 模块的配置注入。
 *
 * @class MailConfigService
 * @implements {MailConfig}
 * @description 邮件配置服务，提供邮件发送所需的配置信息
 */
@Injectable()
export class MailConfigService implements MailConfig {
  /**
   * 构造函数
   *
   * 注入配置服务，用于读取环境变量。
   *
   * @param {ConfigService} configService - NestJS 配置服务
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * 邮件用户名（发件人邮箱地址）
   *
   * 从环境变量 MAIL_USERNAME 读取。
   *
   * @type {string}
   */
  get MAIL_USERNAME(): string {
    return this.configService.getOrThrow<string>('MAIL_USERNAME');
  }

  /**
   * 应用名称
   *
   * 从环境变量 APP_NAME 读取，如果未设置则使用默认值 'HL8 Platform'。
   * 用于邮件模板中的品牌显示。
   *
   * @type {string | undefined}
   */
  get APP_NAME(): string | undefined {
    return this.configService.get<string>('APP_NAME') || 'HL8 Platform';
  }

  /**
   * 应用 URL
   *
   * 从环境变量 APP_URL 读取，如果未设置则使用默认值。
   * 用于邮件模板中的链接和资源引用。
   *
   * @type {string | undefined}
   */
  get APP_URL(): string | undefined {
    return this.configService.get<string>('APP_URL');
  }
}
