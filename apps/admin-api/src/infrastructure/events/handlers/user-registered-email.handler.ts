import { Logger } from '@hl8/logger';
import { MailService, RegisterSuccessMail } from '@hl8/mail';
import { ConfigService } from '@nestjs/config';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../../domain/auth/events/user-registered.event';

/**
 * 用户注册邮件发送事件处理器
 *
 * 处理用户注册事件，发送邮箱验证邮件。
 * 使用 @nestjs/cqrs 的 EventsHandler 装饰器自动注册。
 *
 * @class UserRegisteredEmailHandler
 * @implements {IEventHandler<UserRegisteredEvent>}
 * @description 用户注册邮件发送事件处理器
 */
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredEmailHandler implements IEventHandler<UserRegisteredEvent> {
  /**
   * 构造函数
   *
   * 注入邮件服务和配置服务。
   *
   * @param {MailService} mailService - 邮件服务
   * @param {ConfigService} config - 配置服务
   * @param {Logger} logger - 日志服务
   */
  constructor(
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * 处理用户注册事件
   *
   * 当用户注册事件发布时，自动发送验证邮件。
   *
   * @param {UserRegisteredEvent} event - 用户注册事件
   * @returns {Promise<void>}
   */
  async handle(event: UserRegisteredEvent): Promise<void> {
    try {
      const appName = this.config.get<string>('APP_NAME') || 'HL8 Platform';
      const appUrl =
        this.config.get<string>('APP_URL') || 'https://example.com';

      const emailHtml = RegisterSuccessMail({
        name: event.fullName,
        otp: event.verificationCode,
        appName,
        appUrl,
      });

      await this.mailService.sendEmail({
        to: [event.email],
        subject: `欢迎注册 ${appName} - 请验证您的邮箱`,
        html: emailHtml,
      });

      this.logger.log({
        message: 'Verification email sent',
        userId: event.aggregateId,
        email: event.email,
        eventId: event.eventId,
      });
    } catch (error) {
      // 邮件发送失败不影响注册流程，记录错误即可
      this.logger.error({
        message: 'Failed to send verification email',
        userId: event.aggregateId,
        email: event.email,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
