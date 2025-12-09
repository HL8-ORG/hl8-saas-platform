import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 租户已删除领域事件
 *
 * 当租户被删除时发布的事件。
 * 用于通知其他领域模块租户已删除。
 *
 * **事件用途**：
 * - 清理租户相关数据
 * - 通知外部系统租户已删除
 * - 记录审计日志
 *
 * @class TenantDeletedEvent
 * @extends {DomainEventBase}
 * @description 租户已删除领域事件
 */
export class TenantDeletedEvent extends DomainEventBase {
  /**
   * 租户名称
   *
   * 被删除的租户名称。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 构造函数
   *
   * 创建租户已删除领域事件实例。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} name - 租户名称
   */
  constructor(tenantId: TenantId, name: string) {
    super(tenantId.toString(), 'TenantDeletedEvent', tenantId.toString());
    this.name = name;
  }
}
