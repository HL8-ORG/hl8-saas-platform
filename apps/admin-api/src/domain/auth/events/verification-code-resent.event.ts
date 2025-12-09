import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 验证码重发事件
 *
 * 当重新发送邮箱验证码时发布的领域事件。
 * 用于触发发送验证邮件等操作。
 *
 * @class VerificationCodeResentEvent
 * @extends {DomainEventBase}
 * @description 验证码重发领域事件
 */
export class VerificationCodeResentEvent extends DomainEventBase {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   * @readonly
   */
  public readonly email: string;

  /**
   * 验证码
   *
   * @type {string}
   * @readonly
   */
  public readonly verificationCode: string;

  /**
   * 构造函数
   *
   * 创建验证码重发事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} email - 用户邮箱地址
   * @param {string} verificationCode - 新的验证码
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new VerificationCodeResentEvent(userId, email, code, tenantId);
   * ```
   */
  constructor(
    userId: string,
    email: string,
    verificationCode: string,
    tenantId?: string,
  ) {
    super(userId, 'VerificationCodeResentEvent', tenantId);
    this.email = email;
    this.verificationCode = verificationCode;
  }
}
