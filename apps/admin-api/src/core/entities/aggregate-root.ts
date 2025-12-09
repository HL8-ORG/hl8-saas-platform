import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';

import { DomainEventBase } from '../events/domain-event.base';

/**
 * 聚合根基类
 *
 * 所有聚合根的抽象基类，继承 NestJS CQRS 的 AggregateRoot 并添加属性管理功能。
 * 提供领域事件管理功能，支持与 NestJS CQRS 事件总线集成。
 *
 * **设计原则**：
 * - 继承 NestJS CQRS 的 AggregateRoot，支持事件发布
 * - 提供统一的属性管理（props 模式）
 * - 提供类型安全的领域事件管理
 *
 * **使用方式**：
 * ```typescript
 * export class User extends AggregateRoot<UserProps> {
 *   verifyEmail(code: string): void {
 *     // 业务逻辑
 *     this.apply(new EmailVerifiedEvent(this.id.toString(), this.email.value));
 *   }
 * }
 *
 * // 在应用层使用
 * const user = User.create(...);
 * this.eventPublisher.mergeObjectContext(user);
 * await userRepository.save(user);
 * user.commit(); // 发布事件到事件总线
 * ```
 *
 * @template Props - 聚合根属性的类型
 * @abstract
 * @class AggregateRoot
 * @extends {NestAggregateRoot}
 * @description DDD 聚合根基类，支持领域事件发布
 */
export abstract class AggregateRoot<Props> extends NestAggregateRoot {
  /**
   * 实体属性
   *
   * 存储聚合根的所有属性数据。
   * 采用 props 模式，确保属性的封装性和不可变性。
   *
   * @protected
   * @type {Props}
   */
  protected props: Props;

  /**
   * 构造函数
   *
   * 初始化聚合根属性，并调用父类构造函数。
   *
   * @protected
   * @param {Props} props - 聚合根属性对象
   */
  protected constructor(props: Props) {
    super();
    this.props = props;
  }

  /**
   * 获取未提交的领域事件
   *
   * 返回聚合根的所有未提交到事件总线的领域事件。
   * 主要用于调试和测试场景。
   *
   * @returns {DomainEventBase[]} 未提交的领域事件列表
   */
  getUncommittedEvents(): DomainEventBase[] {
    return super.getUncommittedEvents() as DomainEventBase[];
  }
}
