import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITenantReadRepository } from '../../../../domain/tenants/repositories/tenant-read.repository.interface';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { GetTenantByDomainOutputDto } from '../../dtos/get-tenant-by-domain.input.dto';
import { GetTenantByDomainQuery } from '../get-tenant-by-domain.query';

@QueryHandler(GetTenantByDomainQuery)
export class GetTenantByDomainHandler implements IQueryHandler<GetTenantByDomainQuery> {
  constructor(
    @Inject('ITenantReadRepository')
    private readonly tenantReadRepository: ITenantReadRepository,
  ) {}

  async execute(
    query: GetTenantByDomainQuery,
  ): Promise<GetTenantByDomainOutputDto> {
    const { domain } = query;

    const tenantDomain = new TenantDomain(domain);

    const tenant = await this.tenantReadRepository.findByDomain(tenantDomain);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return new GetTenantByDomainOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
