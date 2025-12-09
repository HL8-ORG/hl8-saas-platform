import { RoleId } from '../../shared/value-objects/role-id.vo';
import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { Role } from '../entities/role.aggregate';
import { RoleName } from '../value-objects/role-name.vo';

/**
 * 角色仓储接口
 *
 * 用于管理角色的仓储接口。
 * 遵循 CQRS 模式，专门用于写操作（命令）。
 *
 * **设计原则**：
 * - 写操作，修改数据
 * - 返回完整的角色聚合根
 * - 支持事务操作
 *
 * @interface IRoleRepository
 * @description 角色仓储接口（CQRS 命令端）
 */
export interface IRoleRepository {
  /**
   * 根据ID查询角色
   *
   * 根据角色ID和租户ID查询角色聚合根。
   *
   * @param {RoleId} roleId - 角色ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  findById(roleId: RoleId, tenantId: TenantId): Promise<Role | null>;

  /**
   * 根据名称查询角色
   *
   * 根据角色名称和租户ID查询角色聚合根。
   *
   * @param {RoleName} name - 角色名称值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  findByName(name: RoleName, tenantId: TenantId): Promise<Role | null>;

  /**
   * 保存角色
   *
   * 保存角色聚合根到持久化存储。
   * 如果角色已存在则更新，否则创建新角色。
   *
   * @param {Role} role - 角色聚合根
   * @returns {Promise<void>}
   */
  save(role: Role): Promise<void>;

  /**
   * 删除角色
   *
   * 物理删除角色。
   *
   * @param {RoleId} roleId - 角色ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  delete(roleId: RoleId, tenantId: TenantId): Promise<void>;
}
