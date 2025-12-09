import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 租户已激活领域事件
 *
 * 当租户被激活时发布的事件。
 * 用于通知其他领域模块租户已激活。
 *
 * **事件用途**：
 * - 恢复租户访问权限
 * - 通知用户租户已激活
 * - 记录审计日志
 *
 * @class TenantActivatedEvent
 * @extends {DomainEventBase}
 * @description 租户已激活领域事件
 */
export class TenantActivatedEvent extends DomainEventBase {
  /**
   * 租户名称
   *
   * 被激活的租户名称。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 构造函数
   *
   * 创建租户已激活领域事件实例。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} name - 租户名称
   */
  constructor(tenantId: TenantId, name: string) {
    super(tenantId.toString(), 'TenantActivatedEvent', tenantId.toString());
    this.name = name;
  }
}
