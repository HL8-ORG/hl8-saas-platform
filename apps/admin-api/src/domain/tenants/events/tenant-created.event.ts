import { DomainEventBase } from '../../../core/events/domain-event.base';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';

/**
 * 租户已创建领域事件
 *
 * 当新租户被创建时发布的事件。
 * 用于通知其他领域模块租户已创建。
 *
 * **事件用途**：
 * - 初始化租户相关配置
 * - 创建默认角色和权限
 * - 发送欢迎邮件
 * - 记录审计日志
 *
 * @class TenantCreatedEvent
 * @extends {DomainEventBase}
 * @description 租户已创建领域事件
 */
export class TenantCreatedEvent extends DomainEventBase {
  /**
   * 租户名称
   *
   * 新创建的租户名称。
   *
   * @type {string}
   */
  public readonly name: string;

  /**
   * 租户域名
   *
   * 新创建的租户域名（可选）。
   *
   * @type {string | undefined}
   */
  public readonly domain?: string;

  /**
   * 构造函数
   *
   * 创建租户已创建领域事件实例。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @param {string} name - 租户名称
   * @param {string} [domain] - 租户域名（可选）
   */
  constructor(tenantId: TenantId, name: string, domain?: string) {
    super(tenantId.toString(), 'TenantCreatedEvent', tenantId.toString());
    this.name = name;
    this.domain = domain;
  }
}
