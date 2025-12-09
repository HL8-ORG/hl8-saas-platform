import { TenantId } from '../../shared/value-objects/tenant-id.vo';
import { UserId } from '../../shared/value-objects/user-id.vo';
import { User } from '../entities/user.aggregate';

/**
 * 用户查询参数
 *
 * 用于查询用户列表的参数。
 *
 * @interface UserQueryParams
 */
export interface UserQueryParams {
  /**
   * 租户ID
   *
   * 限制查询范围到指定租户。
   *
   * @type {string}
   */
  tenantId: string;

  /**
   * 是否仅查询激活用户
   *
   * 如果为 true，只返回激活的用户。
   *
   * @type {boolean}
   */
  isActive?: boolean;

  /**
   * 搜索关键词
   *
   * 用于搜索用户邮箱或全名。
   *
   * @type {string}
   */
  search?: string;

  /**
   * 页码
   *
   * 分页查询的页码，从 1 开始。
   *
   * @type {number}
   */
  page?: number;

  /**
   * 每页数量
   *
   * 每页返回的用户数量。
   *
   * @type {number}
   */
  limit?: number;
}

/**
 * 分页结果
 *
 * 包含数据列表和分页元数据。
 *
 * @interface PaginatedResult
 * @template T 结果项的类型
 */
export interface PaginatedResult<T> {
  /**
   * 数据列表
   *
   * 当前页的数据列表。
   *
   * @type {T[]}
   */
  data: T[];

  /**
   * 分页元数据
   *
   * 包含总数、页码、总页数等信息。
   *
   * @type {Object}
   */
  meta: {
    /**
     * 总记录数
     *
     * @type {number}
     */
    total: number;

    /**
     * 当前页码
     *
     * @type {number}
     */
    page: number;

    /**
     * 每页数量
     *
     * @type {number}
     */
    limit: number;

    /**
     * 总页数
     *
     * @type {number}
     */
    totalPages: number;

    /**
     * 是否有下一页
     *
     * @type {boolean}
     */
    hasNext: boolean;

    /**
     * 是否有上一页
     *
     * @type {boolean}
     */
    hasPrevious: boolean;
  };
}

/**
 * 用户只读仓储接口
 *
 * 用于查询用户信息的只读仓储。
 * 遵循 CQRS 模式，专门用于查询操作，可以针对查询性能进行优化。
 *
 * **设计原则**：
 * - 只读操作，不修改数据
 * - 可以针对查询性能优化（索引、缓存等）
 * - 返回脱敏的用户数据
 *
 * @interface IUserReadRepository
 * @description 用户只读仓储接口（CQRS 查询端）
 */
export interface IUserReadRepository {
  /**
   * 根据ID查询用户
   *
   * 根据用户ID和租户ID查询用户信息。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<User | null>} 用户聚合根，如果不存在则返回 null
   */
  findById(userId: UserId, tenantId: TenantId): Promise<User | null>;

  /**
   * 查询用户列表
   *
   * 根据查询参数分页查询用户列表。
   * 返回脱敏的用户数据。
   *
   * @param {UserQueryParams} params - 查询参数
   * @returns {Promise<PaginatedResult<User>>} 分页结果，包含用户列表和分页元数据
   */
  findMany(params: UserQueryParams): Promise<PaginatedResult<User>>;

  /**
   * 检查用户是否存在
   *
   * 检查指定用户是否存在于指定租户中。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果用户存在返回 true，否则返回 false
   */
  exists(userId: UserId, tenantId: TenantId): Promise<boolean>;
}
