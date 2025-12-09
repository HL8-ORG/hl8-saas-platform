import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';
import { User } from '../entities/user.aggregate';

/**
 * 用户资料仓储接口
 *
 * 用于管理用户资料的仓储接口。
 * 遵循 CQRS 模式，专门用于写操作（命令）。
 *
 * **设计原则**：
 * - 写操作，修改数据
 * - 返回完整的用户聚合根
 * - 支持事务操作
 *
 * @interface IUserProfileRepository
 * @description 用户资料仓储接口（CQRS 命令端）
 */
export interface IUserProfileRepository {
  /**
   * 根据ID查询用户
   *
   * 根据用户ID和租户ID查询用户聚合根。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<User | null>} 用户聚合根，如果不存在则返回 null
   */
  findById(userId: UserId, tenantId: TenantId): Promise<User | null>;

  /**
   * 保存用户
   *
   * 保存用户聚合根到持久化存储。
   * 如果用户已存在则更新，否则创建新用户。
   *
   * @param {User} user - 用户聚合根
   * @returns {Promise<void>}
   */
  save(user: User): Promise<void>;

  /**
   * 删除用户
   *
   * 软删除用户，将用户设置为非激活状态。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  delete(userId: UserId, tenantId: TenantId): Promise<void>;
}
