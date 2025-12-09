import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色已创建领域事件
 *
 * 当新角色被创建时发布的事件。
 * 用于通知其他领域模块角色已创建。
 *
 * **事件用途**：
 * - 初始化角色相关配置
 * - 记录审计日志
 *
 * @class RoleCreatedEvent
 * @extends {DomainEventBase}
 * @description 角色已创建领域事件
 */
export class RoleCreatedEvent extends DomainEventBase {
  /**
   * 角色名称
   *
   * 新创建的角色名称。
   *
   * @type {string}
   */
  public readonly roleName: string;

  /**
   * 构造函数
   *
   * 创建角色已创建领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} roleName - 角色名称
   */
  constructor(roleId: string, tenantId: TenantId, roleName: string) {
    super(roleId, 'RoleCreatedEvent', tenantId.toString());
    this.roleName = roleName;
  }
}
