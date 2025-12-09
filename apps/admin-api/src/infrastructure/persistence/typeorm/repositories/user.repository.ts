import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { User as DomainUser } from '../../../../domain/users/entities/user.aggregate';
import { UserMapper } from '../../mappers/user.mapper';
import { User as OrmUser } from '../entities/user.entity';

/**
 * 用户仓储实现
 *
 * 基于 TypeORM 的用户仓储实现，实现领域层的 IUserRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和持久化。
 *
 * @class UserRepository
 * @implements {IUserRepository}
 * @description 用户仓储实现（TypeORM）
 */
@Injectable()
export class UserRepository implements IUserRepository {
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
   * 根据ID查找用户
   *
   * 根据用户ID和租户ID查询用户聚合根。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<DomainUser | null>} 用户聚合根，如果不存在则返回 null
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
   * 根据邮箱查找用户
   *
   * 通过邮箱地址和租户ID查找用户聚合根。
   *
   * @param {Email} email - 邮箱值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<DomainUser | null>} 找到的用户聚合根或 null
   */
  async findByEmail(
    email: Email,
    tenantId: TenantId,
  ): Promise<DomainUser | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        email: email.value,
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return UserMapper.toDomain(ormEntity);
  }

  /**
   * 检查邮箱是否已存在
   *
   * 检查指定邮箱地址在租户内是否已被使用。
   *
   * @param {Email} email - 邮箱值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果邮箱已存在返回 true，否则返回 false
   */
  async emailExists(email: Email, tenantId: TenantId): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: {
        email: email.value,
        tenantId: tenantId.toString(),
      },
    });
    return count > 0;
  }

  /**
   * 保存用户
   *
   * 保存用户聚合根到持久化存储。
   * 如果用户已存在则更新，否则创建新用户。
   * 性能优化：减少不必要的查询。
   *
   * @param {DomainUser} user - 用户聚合根
   * @returns {Promise<void>}
   */
  async save(user: DomainUser): Promise<void> {
    const ormData = UserMapper.toOrm(user);

    // 性能优化：只查询 id，减少数据传输
    const existingEntity = await this.ormRepository.findOne({
      where: { id: ormData.id },
      select: ['id'], // 性能优化：只查询 id 字段
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
   * 从持久化存储中删除指定的用户。
   *
   * @param {UserId} userId - 用户ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  async delete(userId: UserId, tenantId: TenantId): Promise<void> {
    await this.ormRepository.delete({
      id: userId.toString(),
      tenantId: tenantId.toString(),
    });
  }
}
