import { RoleId } from '../../shared/value-objects/role-id.vo';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Role } from '../entities/role.aggregate';
import { RoleName } from '../value-objects/role-name.vo';

/**
 * 角色只读仓储接口
 *
 * 用于查询角色信息的只读仓储。
 * 遵循 CQRS 模式，专门用于查询操作，可以针对查询性能进行优化。
 *
 * **设计原则**：
 * - 只读操作，不修改数据
 * - 可以针对查询性能优化（索引、缓存等）
 * - 返回脱敏的角色数据
 *
 * @interface IRoleReadRepository
 * @description 角色只读仓储接口（CQRS 查询端）
 */
export interface IRoleReadRepository {
  /**
   * 根据ID查询角色
   *
   * 根据角色ID和租户ID查询角色信息。
   *
   * @param {RoleId} roleId - 角色ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  findById(roleId: RoleId, tenantId: TenantId): Promise<Role | null>;

  /**
   * 根据名称查询角色
   *
   * 根据角色名称和租户ID查询角色信息。
   *
   * @param {RoleName} name - 角色名称值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  findByName(name: RoleName, tenantId: TenantId): Promise<Role | null>;

  /**
   * 查询所有角色
   *
   * 查询指定租户下的所有角色。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role[]>} 角色列表
   */
  findAll(tenantId: TenantId): Promise<Role[]>;

  /**
   * 检查角色是否存在
   *
   * 检查指定角色是否存在于指定租户中。
   *
   * @param {RoleName} name - 角色名称值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果角色存在返回 true，否则返回 false
   */
  exists(name: RoleName, tenantId: TenantId): Promise<boolean>;
}
