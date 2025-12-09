import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色已更新领域事件
 *
 * 当角色信息被更新时发布的事件。
 * 用于通知其他领域模块角色信息已变更。
 *
 * **事件用途**：
 * - 触发缓存失效
 * - 通知外部系统角色信息变更
 * - 记录角色信息变更审计日志
 *
 * @class RoleUpdatedEvent
 * @extends {DomainEventBase}
 * @description 角色已更新领域事件
 */
export class RoleUpdatedEvent extends DomainEventBase {
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
   * 创建角色已更新领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string[]} updatedFields - 更新的字段列表
   */
  constructor(roleId: string, tenantId: TenantId, updatedFields: string[]) {
    super(roleId, 'RoleUpdatedEvent', tenantId.toString());
    this.updatedFields = updatedFields;
  }
}
