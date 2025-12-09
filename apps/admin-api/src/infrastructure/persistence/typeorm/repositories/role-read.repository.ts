import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role as DomainRole } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { RoleName } from '../../../../domain/roles/value-objects/role-name.vo';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { RoleMapper } from '../../mappers/role.mapper';
import { Role as OrmRole } from '../entities/role.entity';

/**
 * 角色只读仓储实现
 *
 * 基于 TypeORM 的角色只读仓储实现，实现领域层的 IRoleReadRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和查询（读操作，CQRS 查询端）。
 *
 * @class RoleReadRepository
 * @implements {IRoleReadRepository}
 * @description 角色只读仓储实现（TypeORM，CQRS 查询端）
 */
@Injectable()
export class RoleReadRepository implements IRoleReadRepository {
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
   * 根据角色ID和租户ID查询角色信息。
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
   * 根据角色名称和租户ID查询角色信息。
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
   * 查询所有角色
   *
   * 查询指定租户下的所有角色，按创建时间倒序排列。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Role[]>} 角色列表
   */
  async findAll(tenantId: TenantId): Promise<DomainRole[]> {
    const ormEntities = await this.ormRepository.find({
      where: { tenantId: tenantId.toString() },
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map((ormEntity) => RoleMapper.toDomain(ormEntity));
  }

  /**
   * 检查角色是否存在
   *
   * 检查指定角色是否存在于指定租户中。
   *
   * @param {RoleName} name - 角色名称值对象
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果角色存在返回 true，否则返回 false
   */
  async exists(name: RoleName, tenantId: TenantId): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: {
        name: name.value,
        tenantId: tenantId.toString(),
      },
    });
    return count > 0;
  }
}
