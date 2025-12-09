import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 邮箱已验证事件
 *
 * 当用户成功验证邮箱时发布的领域事件。
 * 用于触发后续操作，如解锁某些功能等。
 *
 * @class EmailVerifiedEvent
 * @extends {DomainEventBase}
 * @description 邮箱验证领域事件
 */
export class EmailVerifiedEvent extends DomainEventBase {
  /**
   * 用户邮箱地址
   *
   * @type {string}
   * @readonly
   */
  public readonly email: string;

  /**
   * 构造函数
   *
   * 创建邮箱已验证事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} email - 用户邮箱地址
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new EmailVerifiedEvent(userId, email, tenantId);
   * ```
   */
  constructor(userId: string, email: string, tenantId?: string) {
    super(userId, 'EmailVerifiedEvent', tenantId);
    this.email = email;
  }
}
