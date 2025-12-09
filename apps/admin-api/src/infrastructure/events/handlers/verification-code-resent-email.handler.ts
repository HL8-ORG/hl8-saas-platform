import { VerificationCodeResentEvent } from '@/domain/auth/events';
import { Logger } from '@hl8/logger';
import { MailService, RegisterSuccessMail } from '@hl8/mail';
import { ConfigService } from '@nestjs/config';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
// import { VerificationCodeResentEvent } from '../../../../domain/auth/events/verification-code-resent.event';

/**
 * 验证码重发邮件发送事件处理器
 *
 * 处理验证码重发事件，发送新的邮箱验证邮件。
 *
 * @class VerificationCodeResentEmailHandler
 * @implements {IEventHandler<VerificationCodeResentEvent>}
 * @description 验证码重发邮件发送事件处理器
 */
@EventsHandler(VerificationCodeResentEvent)
export class VerificationCodeResentEmailHandler implements IEventHandler<VerificationCodeResentEvent> {
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
   * 处理验证码重发事件
   *
   * 当验证码重发事件发布时，自动发送新的验证邮件。
   *
   * @param {VerificationCodeResentEvent} event - 验证码重发事件
   * @returns {Promise<void>}
   */
  async handle(event: VerificationCodeResentEvent): Promise<void> {
    try {
      const appName = this.config.get<string>('APP_NAME') || 'HL8 Platform';
      const appUrl =
        this.config.get<string>('APP_URL') || 'https://example.com';

      // 从用户仓储获取用户全名（简化处理，实际可以通过事件包含更多信息）
      const emailHtml = RegisterSuccessMail({
        name: event.email.split('@')[0], // 简化处理，使用邮箱前缀作为名称
        otp: event.verificationCode,
        appName,
        appUrl,
      });

      await this.mailService.sendEmail({
        to: [event.email],
        subject: `${appName} - 您的邮箱验证码`,
        html: emailHtml,
      });

      this.logger.log({
        message: 'Verification code email resent',
        userId: event.aggregateId,
        email: event.email,
        eventId: event.eventId,
      });
    } catch (error) {
      // 邮件发送失败不影响流程，记录错误即可
      this.logger.error({
        message: 'Failed to send verification code email',
        userId: event.aggregateId,
        email: event.email,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
