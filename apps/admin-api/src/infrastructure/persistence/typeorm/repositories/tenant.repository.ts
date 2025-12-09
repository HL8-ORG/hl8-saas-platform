import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { Tenant as DomainTenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { TenantMapper } from '../../mappers/tenant.mapper';
import { Tenant as OrmTenant } from '../entities/tenant.entity';

/**
 * 租户仓储实现
 *
 * 基于 TypeORM 的租户仓储实现，实现领域层的 ITenantRepository 接口。
 * 负责领域聚合根和ORM实体之间的映射和持久化（写操作）。
 *
 * @class TenantRepository
 * @implements {ITenantRepository}
 * @description 租户仓储实现（TypeORM，CQRS 命令端）
 */
@Injectable()
export class TenantRepository implements ITenantRepository {
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
   * 根据租户ID查询租户聚合根。
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
   * 根据租户名称查询租户聚合根。
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
   * 根据租户域名查询租户聚合根。
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
   * 保存租户
   *
   * 保存租户聚合根到持久化存储。
   * 如果租户已存在则更新，否则创建新租户。
   *
   * @param {Tenant} tenant - 租户聚合根
   * @returns {Promise<void>}
   */
  async save(tenant: DomainTenant): Promise<void> {
    const ormData = TenantMapper.toOrm(tenant);

    // 检查实体是否已存在
    if (!ormData.id) {
      throw new Error('Tenant ID is missing');
    }

    const existingEntity = await this.ormRepository.findOne({
      where: { id: ormData.id },
    });

    if (existingEntity) {
      // 更新现有实体
      TenantMapper.updateOrm(existingEntity, tenant);
      await this.ormRepository.save(existingEntity);
    } else {
      // 创建新实体
      await this.ormRepository.save(ormData as OrmTenant);
    }
  }

  /**
   * 删除租户
   *
   * 物理删除租户。
   *
   * @param {TenantId} tenantId - 租户ID值对象
   * @returns {Promise<void>}
   */
  async delete(tenantId: TenantId): Promise<void> {
    await this.ormRepository.delete({ id: tenantId.toString() });
  }
}
