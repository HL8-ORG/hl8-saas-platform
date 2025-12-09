import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission as DomainPermission } from '../../../../domain/permissions/entities/permission.aggregate';
import { IPermissionReadRepository } from '../../../../domain/permissions/repositories/permission-read.repository.interface';
import { PermissionId } from '../../../../domain/permissions/value-objects/permission-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { PermissionMapper } from '../../mappers/permission.mapper';
import { Permission as OrmPermission } from '../entities/permission.entity';

/**
 * 权限只读仓储实现
 *
 * @class PermissionReadRepository
 * @implements {IPermissionReadRepository}
 */
@Injectable()
export class PermissionReadRepository implements IPermissionReadRepository {
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

  async findAll(tenantId: TenantId): Promise<DomainPermission[]> {
    const ormEntities = await this.ormRepository.find({
      where: {
        tenantId: tenantId.toString(),
      },
    });

    return ormEntities.map((entity) => PermissionMapper.toDomain(entity));
  }
}
