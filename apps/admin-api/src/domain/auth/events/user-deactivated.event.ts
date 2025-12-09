import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 用户停用事件
 *
 * 当用户账户被停用时发布的领域事件。
 * 用于触发后续操作，如撤销所有令牌、发送通知等。
 *
 * @class UserDeactivatedEvent
 * @extends {DomainEventBase}
 * @description 用户停用领域事件
 */
export class UserDeactivatedEvent extends DomainEventBase {
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
   * 创建用户停用事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} email - 用户邮箱地址
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new UserDeactivatedEvent(userId, email, tenantId);
   * ```
   */
  constructor(userId: string, email: string, tenantId?: string) {
    super(userId, 'UserDeactivatedEvent', tenantId);
    this.email = email;
  }
}
