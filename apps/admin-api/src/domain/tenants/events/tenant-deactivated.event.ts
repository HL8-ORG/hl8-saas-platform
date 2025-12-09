import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 租户已停用领域事件
 *
 * 当租户被停用时发布的事件。
 * 用于通知其他领域模块租户已停用。
 *
 * **事件用途**：
 * - 限制租户访问权限
 * - 通知用户租户已停用
 * - 记录审计日志
 *
 * @class TenantDeactivatedEvent
 * @extends {DomainEventBase}
 * @description 租户已停用领域事件
 */
export class TenantDeactivatedEvent extends DomainEventBase {
  /**
   * 租户名称
   *
   * 被停用的租户名称。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 构造函数
   *
   * 创建租户已停用领域事件实例。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} name - 租户名称
   */
  constructor(tenantId: TenantId, name: string) {
    super(tenantId.toString(), 'TenantDeactivatedEvent', tenantId.toString());
    this.name = name;
  }
}
