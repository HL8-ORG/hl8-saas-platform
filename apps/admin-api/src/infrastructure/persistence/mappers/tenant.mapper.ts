import { Tenant as DomainTenant } from '../../../domain/tenants/entities/tenant.aggregate';
import { Tenant as OrmTenant } from '../typeorm/entities/tenant.entity';

/**
 * 租户映射器
 *
 * 负责领域模型和ORM实体之间的映射转换。
 * 遵循Clean Architecture原则，领域层不依赖基础设施层。
 *
 * @class TenantMapper
 * @description 租户领域模型 ↔ ORM实体映射器
 */
export class TenantMapper {
  /**
   * 将ORM实体转换为领域聚合根
   *
   * 从数据库ORM实体重构领域聚合根。
   *
   * @static
   * @param {OrmTenant} ormEntity - ORM实体
   * @returns {DomainTenant} 领域聚合根
   *
   * @example
   * ```typescript
   * const domainTenant = TenantMapper.toDomain(ormTenant);
   * ```
   */
  static toDomain(ormEntity: OrmTenant): DomainTenant {
    return DomainTenant.reconstitute({
      id: ormEntity.id,
      name: ormEntity.name,
      domain: ormEntity.domain ?? null,
      isActive: ormEntity.isActive,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * 将领域聚合根转换为ORM实体数据
   *
   * 将领域聚合根转换为ORM实体可以使用的数据对象。
   *
   * @static
   * @param {DomainTenant} domainEntity - 领域聚合根
   * @returns {Partial<OrmTenant>} ORM实体数据对象
   *
   * @example
   * ```typescript
   * const ormData = TenantMapper.toOrm(domainTenant);
   * ```
   */
  static toOrm(domainEntity: DomainTenant): Partial<OrmTenant> {
    return {
      id: domainEntity.id.toString(),
      name: domainEntity.name.value,
      domain: domainEntity.domain?.value ?? undefined,
      isActive: domainEntity.isActive,
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * 更新ORM实体
   *
   * 使用领域聚合根的数据更新ORM实体。
   *
   * @static
   * @param {OrmTenant} ormEntity - 要更新的ORM实体
   * @param {DomainTenant} domainEntity - 领域聚合根
   * @returns {void}
   *
   * @example
   * ```typescript
   * TenantMapper.updateOrm(ormTenant, domainTenant);
   * ```
   */
  static updateOrm(ormEntity: OrmTenant, domainEntity: DomainTenant): void {
    const data = TenantMapper.toOrm(domainEntity);

    ormEntity.name = data.name!;
    ormEntity.domain = data.domain ?? undefined;
    ormEntity.isActive = data.isActive!;
    ormEntity.updatedAt = data.updatedAt!;
  }
}
