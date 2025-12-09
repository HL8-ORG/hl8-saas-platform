import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission as DomainPermission } from '../../../../domain/permissions/entities/permission.aggregate';
import { IPermissionRepository } from '../../../../domain/permissions/repositories/permission.repository.interface';
import { PermissionId } from '../../../../domain/permissions/value-objects/permission-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { PermissionMapper } from '../../mappers/permission.mapper';
import { Permission as OrmPermission } from '../entities/permission.entity';

/**
 * 权限仓储实现
 *
 * @class PermissionRepository
 * @implements {IPermissionRepository}
 */
@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectRepository(OrmPermission)
    private readonly ormRepository: Repository<OrmPermission>,
  ) {}

  async findById(
    permissionId: PermissionId,
    tenantId: TenantId,
  ): Promise<DomainPermission | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        id: permissionId.toString(),
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return PermissionMapper.toDomain(ormEntity);
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
    tenantId: TenantId,
  ): Promise<DomainPermission | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: {
        resource,
        action,
        tenantId: tenantId.toString(),
      },
    });

    if (!ormEntity) {
      return null;
    }

    return PermissionMapper.toDomain(ormEntity);
  }

  async save(permission: DomainPermission): Promise<void> {
    const existing = await this.ormRepository.findOne({
      where: {
        id: permission.id.toString(),
      },
    });

    if (existing) {
      PermissionMapper.updateOrm(existing, permission);
      await this.ormRepository.save(existing);
    } else {
      const ormData = PermissionMapper.toOrm(permission);
      const newEntity = this.ormRepository.create(ormData);
      await this.ormRepository.save(newEntity);
    }
  }

  async delete(permissionId: PermissionId, tenantId: TenantId): Promise<void> {
    const result = await this.ormRepository.delete({
      id: permissionId.toString(),
      tenantId: tenantId.toString(),
    });

    if (result.affected === 0) {
      // 可以在这里记录警告，或者抛出异常，视业务需求而定
    }
  }
}
