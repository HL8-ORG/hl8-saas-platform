import { Role as DomainRole } from '../../../domain/roles/entities/role.aggregate';
import { Role as OrmRole } from '../typeorm/entities/role.entity';

/**
 * 角色映射器
 *
 * 负责领域模型和ORM实体之间的映射转换。
 * 遵循Clean Architecture原则，领域层不依赖基础设施层。
 *
 * @class RoleMapper
 * @description 角色领域模型 ↔ ORM实体映射器
 */
export class RoleMapper {
  /**
   * 将ORM实体转换为领域聚合根
   *
   * 从数据库ORM实体重构领域聚合根。
   *
   * @static
   * @param {OrmRole} ormEntity - ORM实体
   * @returns {DomainRole} 领域聚合根
   *
   * @example
   * ```typescript
   * const domainRole = RoleMapper.toDomain(ormRole);
   * ```
   */
  static toDomain(ormEntity: OrmRole): DomainRole {
    return DomainRole.reconstitute({
      id: ormEntity.id,
      name: ormEntity.name,
      displayName: ormEntity.displayName || ormEntity.name,
      description: ormEntity.description ?? null,
      isActive: ormEntity.isActive,
      tenantId: ormEntity.tenantId,
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
   * @param {DomainRole} domainEntity - 领域聚合根
   * @returns {Partial<OrmRole>} ORM实体数据对象
   *
   * @example
   * ```typescript
   * const ormData = RoleMapper.toOrm(domainRole);
   * ```
   */
  static toOrm(domainEntity: DomainRole): Partial<OrmRole> {
    return {
      id: domainEntity.id.toString(),
      name: domainEntity.name.value,
      displayName: domainEntity.displayName,
      description: domainEntity.description ?? undefined,
      isActive: domainEntity.isActive,
      tenantId: domainEntity.tenantId.toString(),
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
   * @param {OrmRole} ormEntity - 要更新的ORM实体
   * @param {DomainRole} domainEntity - 领域聚合根
   * @returns {void}
   *
   * @example
   * ```typescript
   * RoleMapper.updateOrm(ormRole, domainRole);
   * ```
   */
  static updateOrm(ormEntity: OrmRole, domainEntity: DomainRole): void {
    const data = RoleMapper.toOrm(domainEntity);

    ormEntity.name = data.name!;
    ormEntity.displayName = data.displayName!;
    ormEntity.description = data.description ?? undefined;
    ormEntity.isActive = data.isActive!;
    ormEntity.updatedAt = data.updatedAt!;
  }
}
