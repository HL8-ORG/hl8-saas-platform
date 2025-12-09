import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import type { IPermissionsService } from '../../../shared/interfaces/permissions-service.interface';
import {
  GetRolePermissionsOutputDto,
  PermissionInfo,
} from '../../dtos/get-role-permissions.input.dto';
import { GetRolePermissionsQuery } from '../get-role-permissions.query';

@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler implements IQueryHandler<GetRolePermissionsQuery> {
  constructor(
    @Inject('IRoleReadRepository')
    private readonly roleReadRepository: IRoleReadRepository,
    @Inject('IPermissionsService')
    private readonly permissionsService: IPermissionsService,
  ) {}

  async execute(
    query: GetRolePermissionsQuery,
  ): Promise<GetRolePermissionsOutputDto> {
    const { roleId, tenantId, withDetails } = query;

    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    const role = await this.roleReadRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const permissions = await this.permissionsService.getRolePermissions(
      role.id.toString(),
    );

    const permissionInfos = permissions.map(
      (p) => new PermissionInfo({ resource: p.resource, action: p.action }),
    );

    return new GetRolePermissionsOutputDto({
      permissions: permissionInfos,
    });
  }
}
