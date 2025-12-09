import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { User as DomainUser } from '../../../../domain/users/entities/user.aggregate';
import { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import { UserMapper } from '../../mappers/user.mapper';
import { User as OrmUser } from '../entities/user.entity';

/**
 * 用户资料仓储实现
 *
 * 基于 TypeORM 的用户资料仓储实现，实现领域层的 IUserProfileRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和持久化（写操作）。
 *
 * @class UserProfileRepository
 * @implements {IUserProfileRepository}
 * @description 用户资料仓储实现（TypeORM，CQRS 命令端）
 */
@Injectable()
export class UserProfileRepository implements IUserProfileRepository {
  /**
   * 构造函数
   *
   * 注入 TypeORM User 仓储。
   *
   * @param {Repository<OrmUser>} ormRepository - TypeORM User 仓储
   */
  constructor(
    @InjectRepository(OrmUser)
    private readonly ormRepository: Repository<OrmUser>,
  ) {}

  /**
   * 根据ID查询用户
   *
   * 根据用户ID和租户ID查询用户聚合根。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<User | null>} 用户聚合根，如果不存在则返回 null
   */
  async findById(
    userId: UserId,
    tenantId: TenantId,
  ): Promise<DomainUser | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        id: userId.toString(),
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return UserMapper.toDomain(ormEntity);
  }

  /**
   * 保存用户
   *
   * 保存用户聚合根到持久化存储。
   * 如果用户已存在则更新，否则创建新用户。
   *
   * @param {User} user - 用户聚合根
   * @returns {Promise<void>}
   */
  async save(user: DomainUser): Promise<void> {
    const ormData = UserMapper.toOrm(user);

    // 检查实体是否已存在
    const existingEntity = await this.ormRepository.findOne({
      where: { id: ormData.id },
    });

    if (existingEntity) {
      // 更新现有实体
      UserMapper.updateOrm(existingEntity, user);
      await this.ormRepository.save(existingEntity);
    } else {
      // 创建新实体
      await this.ormRepository.save(ormData as OrmUser);
    }
  }

  /**
   * 删除用户
   *
   * 软删除用户，将用户设置为非激活状态。
   * 注意：这里只是标记删除，实际删除由聚合根的deactivate方法处理。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  async delete(userId: UserId, tenantId: TenantId): Promise<void> {
    // 软删除：更新isActive为false
    await this.ormRepository.update(
      {
        id: userId.toString(),
        tenantId: tenantId.toString(),
      },
      {
        isActive: false,
      },
    );
  }
}
