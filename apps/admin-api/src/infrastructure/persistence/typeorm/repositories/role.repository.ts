import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role as DomainRole } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { RoleName } from '../../../../domain/roles/value-objects/role-name.vo';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { RoleMapper } from '../../mappers/role.mapper';
import { Role as OrmRole } from '../entities/role.entity';

/**
 * 角色仓储实现
 *
 * 基于 TypeORM 的角色仓储实现，实现领域层的 IRoleRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和持久化（写操作）。
 *
 * @class RoleRepository
 * @implements {IRoleRepository}
 * @description 角色仓储实现（TypeORM，CQRS 命令端）
 */
@Injectable()
export class RoleRepository implements IRoleRepository {
  /**
   * 构造函数
   *
   * 注入 TypeORM Role 仓储。
   *
   * @param {Repository<OrmRole>} ormRepository - TypeORM Role 仓储
   */
  constructor(
    @InjectRepository(OrmRole)
    private readonly ormRepository: Repository<OrmRole>,
  ) {}

  /**
   * 根据ID查询角色
   *
   * 根据角色ID和租户ID查询角色聚合根。
   *
   * @param {RoleId} roleId - 角色ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  async findById(
    roleId: RoleId,
    tenantId: TenantId,
  ): Promise<DomainRole | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        id: roleId.toString(),
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return RoleMapper.toDomain(ormEntity);
  }

  /**
   * 根据名称查询角色
   *
   * 根据角色名称和租户ID查询角色聚合根。
   *
   * @param {RoleName} name - 角色名称值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role | null>} 角色聚合根，如果不存在则返回 null
   */
  async findByName(
    name: RoleName,
    tenantId: TenantId,
  ): Promise<DomainRole | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        name: name.value,
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return RoleMapper.toDomain(ormEntity);
  }

  /**
   * 保存角色
   *
   * 保存角色聚合根到持久化存储。
   * 如果角色已存在则更新，否则创建新角色。
   * 性能优化：使用 upsert 或直接 save，减少查询次数。
   *
   * @param {Role} role - 角色聚合根
   * @returns {Promise<void>}
   */
  async save(role: DomainRole): Promise<void> {
    const ormData = RoleMapper.toOrm(role);

    if (!ormData.id) {
      throw new Error('Role ID is missing');
    }

    // 性能优化：直接使用 save，TypeORM 会自动判断是插入还是更新
    // 如果确定是新实体，可以使用 insert；如果是更新，可以使用 update
    // 这里使用 save 是最安全的方式，TypeORM 会处理冲突
    const existingEntity = await this.ormRepository.findOne({
      where: { id: ormData.id },
      select: ['id'], // 性能优化：只查询 id，减少数据传输
    });

    if (existingEntity) {
      // 性能优化：使用 update 直接更新，避免加载完整实体
      RoleMapper.updateOrm(existingEntity, role);
      await this.ormRepository.save(existingEntity);
    } else {
      // 创建新实体
      await this.ormRepository.save(ormData as OrmRole);
    }
  }

  /**
   * 删除角色
   *
   * 物理删除角色。
   *
   * @param {RoleId} roleId - 角色ID值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  async delete(roleId: RoleId, tenantId: TenantId): Promise<void> {
    await this.ormRepository.delete({
      id: roleId.toString(),
      tenantId: tenantId.toString(),
    });
  }
}
