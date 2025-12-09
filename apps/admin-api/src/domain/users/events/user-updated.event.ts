import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';

/**
 * 用户已更新领域事件
 *
 * 当用户信息被更新时发布的事件。
 * 用于通知其他领域模块用户信息已变更。
 *
 * **事件用途**：
 * - 触发缓存失效
 * - 通知外部系统用户信息变更
 * - 记录用户信息变更审计日志
 *
 * @class UserUpdatedEvent
 * @extends {DomainEventBase}
 * @description 用户已更新领域事件
 */
export class UserUpdatedEvent extends DomainEventBase {
  /**
   * 用户ID
   *
   * 被更新的用户唯一标识符。
   *
   * @type {string}
   */
  public readonly userId: string;

  /**
   * 更新的字段
   *
   * 本次更新涉及的字段列表。
   *
   * @type {string[]}
   */
  public readonly updatedFields: string[];

  /**
   * 构造函数
   *
   * 创建用户已更新领域事件实例。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string[]} updatedFields - 更新的字段列表
   */
  constructor(userId: UserId, tenantId: TenantId, updatedFields: string[]) {
    super(userId.toString(), 'UserUpdatedEvent', tenantId.toString());
    this.userId = userId.toString();
    this.updatedFields = updatedFields;
  }
}
