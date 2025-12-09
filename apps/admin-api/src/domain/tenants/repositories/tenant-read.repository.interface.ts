import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Tenant } from '../entities/tenant.aggregate';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantName } from '../value-objects/tenant-name.vo';

/**
 * 租户只读仓储接口
 *
 * 用于查询租户信息的只读仓储。
 * 遵循 CQRS 模式，专门用于查询操作，可以针对查询性能进行优化。
 *
 * **设计原则**：
 * - 只读操作，不修改数据
 * - 可以针对查询性能优化（索引、缓存等）
 * - 返回脱敏的租户数据
 *
 * @interface ITenantReadRepository
 * @description 租户只读仓储接口（CQRS 查询端）
 */
export interface ITenantReadRepository {
  /**
   * 根据ID查询租户
   *
   * 根据租户ID查询租户信息。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findById(tenantId: TenantId): Promise<Tenant | null>;

  /**
   * 根据名称查询租户
   *
   * 根据租户名称查询租户信息。
   *
   * @param {TenantName} name - 租户名称值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findByName(name: TenantName): Promise<Tenant | null>;

  /**
   * 根据域名查询租户
   *
   * 根据租户域名查询租户信息。
   *
   * @param {TenantDomain} domain - 租户域名值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  findByDomain(domain: TenantDomain): Promise<Tenant | null>;

  /**
   * 查询所有租户
   *
   * 查询系统中的所有租户。
   *
   * @returns {Promise<Tenant[]>} 租户列表
   */
  findAll(): Promise<Tenant[]>;

  /**
   * 检查租户是否存在
   *
   * 检查指定租户是否存在。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果租户存在返回 true，否则返回 false
   */
  exists(tenantId: TenantId): Promise<boolean>;
}
