import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { GetTenantByIdOutputDto } from '../../dtos/get-tenant-by-id.input.dto';
import { GetTenantByIdQuery } from '../get-tenant-by-id.query';

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(
    @Inject('ITenantReadRepository')
    private readonly tenantReadRepository: ITenantReadRepository,
  ) {}

  async execute(query: GetTenantByIdQuery): Promise<GetTenantByIdOutputDto> {
    const { tenantId } = query;

    const tenantIdVo = new TenantId(tenantId);

    const tenant = await this.tenantReadRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return new GetTenantByIdOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
