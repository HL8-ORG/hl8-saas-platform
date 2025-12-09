import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';
import { User } from '../../users/entities/user.aggregate';
import { Email } from '../value-objects/email.vo';

/**
 * 用户仓储接口
 *
 * 定义用户聚合根的持久化操作接口。
 * 仓储接口定义在领域层，实现放在基础设施层，遵循依赖倒置原则。
 *
 * **设计原则**：
 * - 遵循 CQRS 模式
 * - 使用强类型值对象
 * - 明确的空值处理 (返回 null)
 *
 * @interface IUserRepository
 * @description 用户聚合根仓储接口
 */
export interface IUserRepository {
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
   * 根据邮箱查找用户
   *
   * 通过邮箱地址和租户ID查找用户聚合根。
   *
   * @param {Email} email - 邮箱值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<User | null>} 找到的用户聚合根或 null
   *
   * @example
   * ```typescript
   * const email = new Email('user@example.com');
   * const tenantId = new TenantId('tenant-123');
   * const user = await userRepository.findByEmail(email, tenantId);
   * ```
   */
  findByEmail(email: Email, tenantId: TenantId): Promise<User | null>;

  /**
   * 检查邮箱是否已存在
   *
   * 检查指定邮箱地址在租户内是否已被使用。
   *
   * @param {Email} email - 邮箱值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果邮箱已存在返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const email = new Email('user@example.com');
   * const tenantId = new TenantId('tenant-123');
   * const exists = await userRepository.emailExists(email, tenantId);
   * ```
   */
  emailExists(email: Email, tenantId: TenantId): Promise<boolean>;

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
   * 从持久化存储中删除指定的用户。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  delete(userId: UserId, tenantId: TenantId): Promise<void>;
}
