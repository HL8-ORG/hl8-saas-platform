import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 密码修改事件
 *
 * 当用户成功修改密码时发布的领域事件。
 * 用于触发后续操作，如通知用户、记录安全日志等。
 *
 * @class PasswordChangedEvent
 * @extends {DomainEventBase}
 * @description 密码修改领域事件
 */
export class PasswordChangedEvent extends DomainEventBase {
  /**
   * 构造函数
   *
   * 创建密码修改事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new PasswordChangedEvent(userId, tenantId);
   * ```
   */
  constructor(userId: string, tenantId?: string) {
    super(userId, 'PasswordChangedEvent', tenantId);
  }
}
