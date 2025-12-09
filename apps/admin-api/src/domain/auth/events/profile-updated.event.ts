import { DomainEventBase } from '../../../core/events/domain-event.base';

/**
 * 用户资料更新事件
 *
 * 当用户资料被更新时发布的领域事件。
 * 用于触发后续操作，如更新缓存、记录审计日志等。
 *
 * @class ProfileUpdatedEvent
 * @extends {DomainEventBase}
 * @description 用户资料更新领域事件
 */
export class ProfileUpdatedEvent extends DomainEventBase {
  /**
   * 更新的字段列表
   *
   * @type {string[]}
   * @readonly
   */
  public readonly updatedFields: string[];

  /**
   * 构造函数
   *
   * 创建用户资料更新事件实例。
   *
   * @param {string} userId - 用户ID（聚合根ID）
   * @param {string[]} updatedFields - 更新的字段列表
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * const event = new ProfileUpdatedEvent(userId, ['fullName', 'avatar'], tenantId);
   * ```
   */
  constructor(userId: string, updatedFields: string[], tenantId?: string) {
    super(userId, 'ProfileUpdatedEvent', tenantId);
    this.updatedFields = updatedFields;
  }
}
