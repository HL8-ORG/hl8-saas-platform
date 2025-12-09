import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import {
  GetTenantOutputDto,
  GetTenantsOutputDto,
} from '../../dtos/get-tenants.input.dto';
import { GetTenantsQuery } from '../get-tenants.query';

@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(
    @Inject('ITenantReadRepository')
    private readonly tenantReadRepository: ITenantReadRepository,
  ) {}

  async execute(query: GetTenantsQuery): Promise<GetTenantsOutputDto> {
    const tenants = await this.tenantReadRepository.findAll();

    const data = tenants.map(
      (tenant) =>
        new GetTenantOutputDto({
          id: tenant.id.toString(),
          name: tenant.name.value,
          domain: tenant.domain?.value ?? null,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        }),
    );

    return new GetTenantsOutputDto({ data });
  }
}
