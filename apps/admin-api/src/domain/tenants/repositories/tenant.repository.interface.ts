import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Tenant } from '../entities/tenant.aggregate';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantName } from '../value-objects/tenant-name.vo';

/**
 * 租户仓储接口
 *
 * 用于管理租户的仓储接口。
 * 遵循 CQRS 模式，专门用于写操作（命令）。
 *
 * **设计原则**：
 * - 写操作，修改数据
 * - 返回完整的租户聚合根
 * - 支持事务操作
 *
 * @interface ITenantRepository
 * @description 租户仓储接口（CQRS 命令端）
 */
export interface ITenantRepository {
  /**
   * 根据ID查询租户
   *
   * 根据租户ID查询租户聚合根。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findById(tenantId: TenantId): Promise<Tenant | null>;

  /**
   * 根据名称查询租户
   *
   * 根据租户名称查询租户聚合根。
   *
   * @param {TenantName} name - 租户名称值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findByName(name: TenantName): Promise<Tenant | null>;

  /**
   * 根据域名查询租户
   *
   * 根据租户域名查询租户聚合根。
   *
   * @param {TenantDomain} domain - 租户域名值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findByDomain(domain: TenantDomain): Promise<Tenant | null>;

  /**
   * 保存租户
   *
   * 保存租户聚合根到持久化存储。
   * 如果租户已存在则更新，否则创建新租户。
   *
   * @param {Tenant} tenant - 租户聚合根
   * @returns {Promise<void>}
   */
  save(tenant: Tenant): Promise<void>;

  /**
   * 删除租户
   *
   * 物理删除租户。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  delete(tenantId: TenantId): Promise<void>;
}
