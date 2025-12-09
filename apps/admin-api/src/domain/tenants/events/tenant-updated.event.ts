import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 租户已更新领域事件
 *
 * 当租户信息被更新时发布的事件。
 * 用于通知其他领域模块租户信息已变更。
 *
 * **事件用途**：
 * - 触发缓存失效
 * - 通知外部系统租户信息变更
 * - 记录租户信息变更审计日志
 *
 * @class TenantUpdatedEvent
 * @extends {DomainEventBase}
 * @description 租户已更新领域事件
 */
export class TenantUpdatedEvent extends DomainEventBase {
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
   * 创建租户已更新领域事件实例。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string[]} updatedFields - 更新的字段列表
   */
  constructor(tenantId: TenantId, updatedFields: string[]) {
    super(tenantId.toString(), 'TenantUpdatedEvent', tenantId.toString());
    this.updatedFields = updatedFields;
  }
}
