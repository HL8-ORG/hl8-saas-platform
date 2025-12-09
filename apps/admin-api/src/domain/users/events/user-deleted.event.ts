import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';

/**
 * 用户已删除领域事件
 *
 * 当用户被软删除（停用）时发布的事件。
 * 用于通知其他领域模块用户已被删除。
 *
 * **事件用途**：
 * - 触发刷新令牌清理
 * - 通知外部系统用户已删除
 * - 记录用户删除审计日志
 * - 清理用户的关联数据
 *
 * @class UserDeletedEvent
 * @extends {DomainEventBase}
 * @description 用户已删除领域事件
 */
export class UserDeletedEvent extends DomainEventBase {
  /**
   * 用户ID
   *
   * 被删除的用户唯一标识符。
   *
   * @type {string}
   */
  public readonly userId: string;

  /**
   * 用户邮箱
   *
   * 被删除用户的邮箱地址，用于审计和通知。
   *
   * @type {string}
   */
  public readonly email: string;

  /**
   * 构造函数
   *
   * 创建用户已删除领域事件实例。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} email - 用户邮箱
   */
  constructor(userId: UserId, tenantId: TenantId, email: string) {
    super(userId.toString(), 'UserDeletedEvent', tenantId.toString());
    this.userId = userId.toString();
    this.email = email;
  }
}
