import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { Tenant as DomainTenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { TenantMapper } from '../../mappers/tenant.mapper';
import { Tenant as OrmTenant } from '../entities/tenant.entity';

/**
 * 租户只读仓储实现
 *
 * 基于 TypeORM 的租户只读仓储实现，实现领域层的 ITenantReadRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和查询（读操作，CQRS 查询端）。
 *
 * @class TenantReadRepository
 * @implements {ITenantReadRepository}
 * @description 租户只读仓储实现（TypeORM，CQRS 查询端）
 */
@Injectable()
export class TenantReadRepository implements ITenantReadRepository {
  /**
   * 构造函数
   *
   * 注入 TypeORM Tenant 仓储。
   *
   * @param {Repository<OrmTenant>} ormRepository - TypeORM Tenant 仓储
   */
  constructor(
    @InjectRepository(OrmTenant)
    private readonly ormRepository: Repository<OrmTenant>,
  ) {}

  /**
   * 根据ID查询租户
   *
   * 根据租户ID查询租户信息。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  async findById(tenantId: TenantId): Promise<DomainTenant | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id: tenantId.toString() },
    });

    if (!ormEntity) {
      return null;
    }

    return TenantMapper.toDomain(ormEntity);
  }

  /**
   * 根据名称查询租户
   *
   * 根据租户名称查询租户信息。
   *
   * @param {TenantName} name - 租户名称值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  async findByName(name: TenantName): Promise<DomainTenant | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { name: name.value },
    });

    if (!ormEntity) {
      return null;
    }

    return TenantMapper.toDomain(ormEntity);
  }

  /**
   * 根据域名查询租户
   *
   * 根据租户域名查询租户信息。
   *
   * @param {TenantDomain} domain - 租户域名值对象
   * @returns {Promise<Tenant | null>} 租户聚合根，如果不存在则返回 null
   */
  async findByDomain(domain: TenantDomain): Promise<DomainTenant | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { domain: domain.value },
    });

    if (!ormEntity) {
      return null;
    }

    return TenantMapper.toDomain(ormEntity);
  }

  /**
   * 查询所有租户
   *
   * 查询系统中的所有租户，按创建时间倒序排列。
   *
   * @returns {Promise<Tenant[]>} 租户列表
   */
  async findAll(): Promise<DomainTenant[]> {
    const ormEntities = await this.ormRepository.find({
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map((ormEntity) => TenantMapper.toDomain(ormEntity));
  }

  /**
   * 检查租户是否存在
   *
   * 检查指定租户是否存在。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<boolean>} 如果租户存在返回 true，否则返回 false
   */
  async exists(tenantId: TenantId): Promise<boolean> {
    const count = await this.ormRepository.count({
      where: { id: tenantId.toString() },
    });
    return count > 0;
  }
}
