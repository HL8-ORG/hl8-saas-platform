import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 角色权限已撤销领域事件
 *
 * 当角色权限被撤销时发布的事件。
 * 用于通知其他领域模块角色权限已变更。
 *
 * **事件用途**：
 * - 更新权限缓存
 * - 记录审计日志
 *
 * @class RolePermissionRevokedEvent
 * @extends {DomainEventBase}
 * @description 角色权限已撤销领域事件
 */
export class RolePermissionRevokedEvent extends DomainEventBase {
  /**
   * 角色名称
   *
   * 被撤销权限的角色名称。
   *
   * @type {string}
   */
  public readonly roleName: string;

  /**
   * 资源标识
   *
   * 权限控制的资源标识。
   *
   * @type {string}
   */
  public readonly resource: string;

  /**
   * 操作类型
   *
   * 权限操作类型。
   *
   * @type {string}
   */
  public readonly action: string;

  /**
   * 构造函数
   *
   * 创建角色权限已撤销领域事件实例。
   *
   * @param {string} roleId - 角色ID
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} roleName - 角色名称
   * @param {string} resource - 资源标识
   * @param {string} action - 操作类型
   */
  constructor(
    roleId: string,
    tenantId: TenantId,
    roleName: string,
    resource: string,
    action: string,
  ) {
    super(roleId, 'RolePermissionRevokedEvent', tenantId.toString());
    this.roleName = roleName;
    this.resource = resource;
    this.action = action;
  }
}
