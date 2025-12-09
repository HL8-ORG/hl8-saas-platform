import { IEvent } from '@nestjs/cqrs';

/**
 * 领域事件基类
 *
 * 所有领域事件的基类，提供事件的基本属性和行为。
 * 领域事件用于表示领域模型中发生的重要业务事件，
 * 如用户注册、邮箱验证、密码修改等。
 *
 * 领域事件支持事件溯源和最终一致性，允许解耦领域模型与其他上下文。
 * 实现 NestJS CQRS 的 IEvent 接口，确保与事件总线兼容。
 *
 * @abstract
 * @class DomainEventBase
 * @implements {IEvent}
 * @description DDD 领域事件基类，所有领域事件都应继承此类
 */
export abstract class DomainEventBase implements IEvent {
  /**
   * 事件唯一标识符
   *
   * 每个事件实例都有唯一的标识符，用于事件去重和追踪。
   *
   * @type {string}
   * @readonly
   */
  public readonly eventId: string;

  /**
   * 聚合根ID
   *
   * 产生此事件的聚合根的标识符，用于事件关联和查询。
   *
   * @type {string}
   * @readonly
   */
  public readonly aggregateId: string;

  /**
   * 事件类型
   *
   * 事件的类型名称，用于事件路由和处理。
   *
   * @type {string}
   * @readonly
   */
  public readonly eventType: string;

  /**
   * 事件发生时间
   *
   * 事件在领域模型中发生的时间戳。
   *
   * @type {Date}
   * @readonly
   */
  public readonly occurredAt: Date;

  /**
   * 租户ID
   *
   * 多租户场景下的租户标识符，用于事件隔离。
   *
   * @type {string | undefined}
   * @readonly
   */
  public readonly tenantId?: string;

  /**
   * 构造函数
   *
   * 创建领域事件实例，自动生成事件ID和设置发生时间。
   *
   * @param {string} aggregateId - 聚合根ID
   * @param {string} eventType - 事件类型名称
   * @param {string} [tenantId] - 可选的租户ID
   *
   * @example
   * ```typescript
   * class UserRegisteredEvent extends DomainEventBase {
   *   constructor(
   *     public readonly userId: string,
   *     public readonly email: string,
   *     tenantId?: string
   *   ) {
   *     super(userId, 'UserRegisteredEvent', tenantId);
   *   }
   * }
   * ```
   */
  constructor(aggregateId: string, eventType: string, tenantId?: string) {
    this.eventId = this.generateEventId();
    this.aggregateId = aggregateId;
    this.eventType = eventType;
    this.occurredAt = new Date();
    this.tenantId = tenantId;
  }

  /**
   * 生成事件ID
   *
   * 使用时间戳和随机数生成唯一的事件标识符。
   *
   * @private
   * @returns {string} 事件唯一标识符
   */
  private generateEventId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}`;
  }
}
