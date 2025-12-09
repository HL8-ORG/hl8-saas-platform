import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IPermissionReadRepository } from '../../../../domain/permissions/repositories/permission-read.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { GetPermissionsOutputDto } from '../../dtos/get-permissions.input.dto';
import { GetPermissionsQuery } from '../get-permissions.query';

@QueryHandler(GetPermissionsQuery)
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(
    @Inject('IPermissionReadRepository')
    private readonly permissionReadRepository: IPermissionReadRepository,
  ) {}

  async execute(
    query: GetPermissionsQuery,
  ): Promise<GetPermissionsOutputDto[]> {
    const { tenantId } = query;
    const tenantIdVo = new TenantId(tenantId);

    const permissions = await this.permissionReadRepository.findAll(tenantIdVo);

    return permissions.map(
      (permission) =>
        new GetPermissionsOutputDto({
          id: permission.id.toString(),
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        }),
    );
  }
}
