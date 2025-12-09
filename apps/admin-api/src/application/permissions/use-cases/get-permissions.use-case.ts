import { Inject, Injectable } from '@nestjs/common';
import type { IPermissionReadRepository } from '../../../domain/permissions/repositories/permission-read.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetPermissionsInputDto,
  GetPermissionsOutputDto,
} from '../dtos/get-permissions.input.dto';

@Injectable()
export class GetPermissionsUseCase implements IUseCase<
  GetPermissionsInputDto,
  GetPermissionsOutputDto[]
> {
  constructor(
    @Inject('IPermissionReadRepository')
    private readonly permissionReadRepository: IPermissionReadRepository,
  ) {}

  async execute(
    input: GetPermissionsInputDto,
  ): Promise<GetPermissionsOutputDto[]> {
    const { tenantId } = input;
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
