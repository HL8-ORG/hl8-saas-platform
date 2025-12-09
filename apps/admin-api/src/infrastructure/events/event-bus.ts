import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { DomainEventBase } from '../../core/events/domain-event.base';

/**
 * 领域事件总线接口
 *
 * 定义领域事件发布接口，用于解耦领域层和基础设施层。
 * 领域模型通过此接口发布事件，基础设施层负责事件的持久化和分发。
 *
 * @interface IEventBus
 * @description 领域事件总线接口，封装事件发布逻辑
 */
export abstract class IEventBus {
  /**
   * 发布领域事件
   *
   * 将领域事件发布到事件总线，由事件处理器异步处理。
   *
   * @param {DomainEventBase} event - 要发布的领域事件
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await eventBus.publish(new UserRegisteredEvent(userId, email, tenantId));
   * ```
   */
  abstract publish(event: DomainEventBase): Promise<void>;

  /**
   * 批量发布领域事件
   *
   * 一次性发布多个领域事件，提高性能。
   *
   * @param {DomainEventBase[]} events - 要发布的领域事件数组
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await eventBus.publishAll([
   *   new UserRegisteredEvent(userId, email),
   *   new EmailVerificationSentEvent(userId)
   * ]);
   * ```
   */
  abstract publishAll(events: DomainEventBase[]): Promise<void>;
}

/**
 * 领域事件总线实现
 *
 * 基于 @nestjs/cqrs 的 EventBus 实现领域事件总线。
 * 负责将领域事件发布到 NestJS CQRS 事件总线，由注册的事件处理器处理。
 *
 * @class DomainEventBus
 * @implements {IEventBus}
 * @description 领域事件总线实现，基于 NestJS CQRS EventBus
 */
@Injectable()
export class DomainEventBus implements IEventBus {
  /**
   * 构造函数
   *
   * 注入 NestJS CQRS EventBus 实例。
   *
   * @param {EventBus} eventBus - NestJS CQRS 事件总线
   */
  constructor(private readonly eventBus: EventBus) {}

  /**
   * 发布领域事件
   *
   * 将领域事件发布到 NestJS CQRS 事件总线。
   *
   * @param {DomainEventBase} event - 要发布的领域事件
   * @returns {Promise<void>}
   */
  async publish(event: DomainEventBase): Promise<void> {
    this.eventBus.publish(event);
  }

  /**
   * 批量发布领域事件
   *
   * 一次性发布多个领域事件到 NestJS CQRS 事件总线。
   *
   * @param {DomainEventBase[]} events - 要发布的领域事件数组
   * @returns {Promise<void>}
   */
  async publishAll(events: DomainEventBase[]): Promise<void> {
    for (const event of events) {
      this.eventBus.publish(event);
    }
  }
}
