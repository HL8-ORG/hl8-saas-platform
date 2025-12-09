import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import {
  GetRoleOutputDto,
  GetRolesOutputDto,
} from '../../dtos/get-roles.input.dto';
import { GetRolesQuery } from '../get-roles.query';

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(
    @Inject('IRoleReadRepository')
    private readonly roleReadRepository: IRoleReadRepository,
  ) {}

  async execute(query: GetRolesQuery): Promise<GetRolesOutputDto> {
    const { tenantId } = query;

    const tenantIdVo = new TenantId(tenantId);

    const roles = await this.roleReadRepository.findAll(tenantIdVo);

    const data = roles.map(
      (role) =>
        new GetRoleOutputDto({
          id: role.id.toString(),
          name: role.name.value,
          displayName: role.displayName,
          description: role.description,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        }),
    );

    return new GetRolesOutputDto({ data });
  }
}
