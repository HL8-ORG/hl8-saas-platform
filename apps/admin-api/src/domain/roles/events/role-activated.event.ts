import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色已激活领域事件
 *
 * 当角色被激活时发布的事件。
 * 用于通知其他领域模块角色已激活。
 *
 * **事件用途**：
 * - 恢复角色使用权限
 * - 记录审计日志
 *
 * @class RoleActivatedEvent
 * @extends {DomainEventBase}
 * @description 角色已激活领域事件
 */
export class RoleActivatedEvent extends DomainEventBase {
  /**
   * 角色名称
   *
   * 被激活的角色名称。
   *
   * @type {string}
   */
  public readonly roleName: string;

  /**
   * 构造函数
   *
   * 创建角色已激活领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} roleName - 角色名称
   */
  constructor(roleId: string, tenantId: TenantId, roleName: string) {
    super(roleId, 'RoleActivatedEvent', tenantId.toString());
    this.roleName = roleName;
  }
}
