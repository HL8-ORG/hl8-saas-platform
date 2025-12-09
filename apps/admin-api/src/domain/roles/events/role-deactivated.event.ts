import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色已停用领域事件
 *
 * 当角色被停用时发布的事件。
 * 用于通知其他领域模块角色已停用。
 *
 * **事件用途**：
 * - 限制角色使用权限
 * - 记录审计日志
 *
 * @class RoleDeactivatedEvent
 * @extends {DomainEventBase}
 * @description 角色已停用领域事件
 */
export class RoleDeactivatedEvent extends DomainEventBase {
  /**
   * 角色名称
   *
   * 被停用的角色名称。
   *
   * @type {string}
   */
  public readonly roleName: string;

  /**
   * 构造函数
   *
   * 创建角色已停用领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} roleName - 角色名称
   */
  constructor(roleId: string, tenantId: TenantId, roleName: string) {
    super(roleId, 'RoleDeactivatedEvent', tenantId.toString());
    this.roleName = roleName;
  }
}
