import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色已删除领域事件
 *
 * 当角色被删除时发布的事件。
 * 用于通知其他领域模块角色已删除。
 *
 * **事件用途**：
 * - 清理角色相关数据
 * - 通知外部系统角色已删除
 * - 记录审计日志
 *
 * @class RoleDeletedEvent
 * @extends {DomainEventBase}
 * @description 角色已删除领域事件
 */
export class RoleDeletedEvent extends DomainEventBase {
  /**
   * 角色名称
   *
   * 被删除的角色名称。
   *
   * @type {string}
   */
  public readonly roleName: string;

  /**
   * 构造函数
   *
   * 创建角色已删除领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} roleName - 角色名称
   */
  constructor(roleId: string, tenantId: TenantId, roleName: string) {
    super(roleId, 'RoleDeletedEvent', tenantId.toString());
    this.roleName = roleName;
  }
}
