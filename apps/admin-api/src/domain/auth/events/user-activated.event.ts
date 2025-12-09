import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 用户激活事件
 *
 * 当用户账户被激活时发布的领域事件。
 * 用于触发后续操作，如发送欢迎邮件等。
 *
 * @class UserActivatedEvent
 * @extends {DomainEventBase}
 * @description 用户激活领域事件
 */
export class UserActivatedEvent extends DomainEventBase {
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
   * 创建用户激活事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} email - 用户邮箱地址
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new UserActivatedEvent(userId, email, tenantId);
   * ```
   */
  constructor(userId: string, email: string, tenantId?: string) {
    super(userId, 'UserActivatedEvent', tenantId);
    this.email = email;
  }
}
