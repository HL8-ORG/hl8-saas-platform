import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { User as DomainUser } from '../../../../domain/users/entities/user.aggregate';
import {
  IUserReadRepository,
  PaginatedResult,
  UserQueryParams,
} from '../../../../domain/users/repositories/user-read.repository.interface';
import { UserMapper } from '../../mappers/user.mapper';
import { User as OrmUser } from '../entities/user.entity';

/**
 * 用户只读仓储实现
 *
 * 基于 TypeORM 的用户只读仓储实现，实现领域层的 IUserReadRepository 接口。
 * 专门用于查询操作，针对查询性能进行了优化：
 * 1. 使用 select 指定返回字段，减少数据传输
 * 2. 集成缓存层，加速高频 ID 查询
 *
 * @class UserReadRepository
 * @implements {IUserReadRepository}
 * @description 用户只读仓储实现（TypeORM，CQRS 查询端）
 */
@Injectable()
export class UserReadRepository implements IUserReadRepository {
  /**
   * 构造函数
   *
   * 注入 TypeORM User 仓储和缓存管理器。
   *
   * @param {Repository<OrmUser>} ormRepository - TypeORM User 仓储
   * @param {Cache} cacheManager - 缓存管理器
   */
  constructor(
    @InjectRepository(OrmUser)
    private readonly ormRepository: Repository<OrmUser>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * 根据ID查询用户
   *
   * 根据用户ID和租户ID查询用户信息。
   * 优先从缓存获取。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<User | null>} 用户聚合根，如果不存在则返回 null
   */
  async findById(
    userId: UserId,
    tenantId: TenantId,
  ): Promise<DomainUser | null> {
    const cacheKey = `user:${tenantId.toString()}:${userId.toString()}`;

    // 尝试从缓存获取
    const cachedUser = await this.cacheManager.get<OrmUser>(cacheKey);
    if (cachedUser) {
      return UserMapper.toDomain(cachedUser);
    }

    // 从数据库查询（指定字段）
    const ormEntity = await this.ormRepository.findOne({
      where: {
        id: userId.toString(),
        tenantId: tenantId.toString(),
      },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'isActive',
        'isEmailVerified',
        'tenantId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!ormEntity) {
      return null;
    }

    // 写入缓存（TTL 5分钟）
    await this.cacheManager.set(cacheKey, ormEntity, 5 * 60 * 1000);

    return UserMapper.toDomain(ormEntity);
  }

  /**
   * 查询用户列表
   *
   * 根据查询参数分页查询用户列表。
   * 返回脱敏的用户数据。
   *
   * @param {UserQueryParams} params - 查询参数
   * @returns {Promise<PaginatedResult<User>>} 分页结果，包含用户列表和分页元数据
   */
  async findMany(
    params: UserQueryParams,
  ): Promise<PaginatedResult<DomainUser>> {
    const { tenantId, page = 1, limit = 10, isActive, search } = params;
    const skip = (page - 1) * limit;

    // 使用 QueryBuilder 构建查询
    const queryBuilder = this.ormRepository.createQueryBuilder('user');

    // 优化：只选择需要的字段
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.fullName',
      'user.role',
      'user.isActive',
      'user.isEmailVerified',
      'user.tenantId',
      'user.createdAt',
      'user.updatedAt',
    ]);

    // 基础条件：租户ID
    queryBuilder.where('user.tenantId = :tenantId', { tenantId });

    // 激活状态过滤
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 排序和分页
    queryBuilder.orderBy('user.createdAt', 'DESC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    // 执行查询
    const [users, total] = await queryBuilder.getManyAndCount();

    // 转换为领域聚合根
    const domainUsers = users.map((user) => UserMapper.toDomain(user));

    // 计算分页元数据
    const totalPages = Math.ceil(total / limit);

    return {
      data: domainUsers,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  /**
   * 检查用户是否存在
   *
   * 检查指定用户是否存在于指定租户中。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果用户存在返回 true，否则返回 false
   */
  async exists(userId: UserId, tenantId: TenantId): Promise<boolean> {
    const cacheKey = `user:${tenantId.toString()}:${userId.toString()}`;

    // 如果缓存中有完整用户，肯定存在
    const cachedUser = await this.cacheManager.get(cacheKey);
    if (cachedUser) {
      return true;
    }

    const count = await this.ormRepository.count({
      where: {
        id: userId.toString(),
        tenantId: tenantId.toString(),
      },
    });

    return count > 0;
  }
}
