import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { IRoleReadRepository } from '../../../../domain/roles/repositories/role-read.repository.interface';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { GetRoleByIdOutputDto } from '../../dtos/get-role-by-id.input.dto';
import { GetRoleByIdQuery } from '../get-role-by-id.query';

@QueryHandler(GetRoleByIdQuery)
export class GetRoleByIdHandler implements IQueryHandler<GetRoleByIdQuery> {
  constructor(
    @Inject('IRoleReadRepository')
    private readonly roleReadRepository: IRoleReadRepository,
  ) {}

  async execute(query: GetRoleByIdQuery): Promise<GetRoleByIdOutputDto> {
    const { roleId, tenantId } = query;

    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    const role = await this.roleReadRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return new GetRoleByIdOutputDto({
      id: role.id.toString(),
      name: role.name.value,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }
}
