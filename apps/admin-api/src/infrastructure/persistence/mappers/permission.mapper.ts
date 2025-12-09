import { Permission as DomainPermission } from '../../../domain/permissions/entities/permission.aggregate';
import { Permission as OrmPermission } from '../typeorm/entities/permission.entity';

/**
 * 权限映射器
 *
 * 负责领域模型和ORM实体之间的映射转换。
 *
 * @class PermissionMapper
 */
export class PermissionMapper {
  /**
   * 将ORM实体转换为领域聚合根
   *
   * @static
   * @param {OrmPermission} ormEntity - ORM实体
   * @returns {DomainPermission} 领域聚合根
   */
  static toDomain(ormEntity: OrmPermission): DomainPermission {
    return DomainPermission.reconstitute({
      id: ormEntity.id,
      resource: ormEntity.resource,
      action: ormEntity.action,
      description: ormEntity.description ?? null,
      tenantId: ormEntity.tenantId,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  /**
   * 将领域聚合根转换为ORM实体数据
   *
   * @static
   * @param {DomainPermission} domainEntity - 领域聚合根
   * @returns {Partial<OrmPermission>} ORM实体数据对象
   */
  static toOrm(domainEntity: DomainPermission): Partial<OrmPermission> {
    return {
      id: domainEntity.id.toString(),
      resource: domainEntity.resource,
      action: domainEntity.action,
      description: domainEntity.description ?? undefined,
      tenantId: domainEntity.tenantId.toString(),
      createdAt: domainEntity.createdAt,
      updatedAt: domainEntity.updatedAt,
    };
  }

  /**
   * 更新ORM实体
   *
   * @static
   * @param {OrmPermission} ormEntity - 要更新的ORM实体
   * @param {DomainPermission} domainEntity - 领域聚合根
   * @returns {void}
   */
  static updateOrm(
    ormEntity: OrmPermission,
    domainEntity: DomainPermission,
  ): void {
    const data = PermissionMapper.toOrm(domainEntity);

    ormEntity.resource = data.resource!;
    ormEntity.action = data.action!;
    ormEntity.description = data.description ?? undefined;
    ormEntity.updatedAt = data.updatedAt!;
  }
}
