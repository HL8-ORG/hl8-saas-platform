import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Tenant } from '../../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { CreateTenantOutputDto } from '../../dtos/create-tenant.input.dto';
import { CreateTenantCommand } from '../create-tenant.command';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantOutputDto> {
    const { name, domain, isActive } = command;

    const tenantName = new TenantName(name);
    const tenantDomain = domain ? new TenantDomain(domain) : null;

    const existingByName = await this.tenantRepository.findByName(tenantName);
    if (existingByName) {
      throw new ConflictException(`租户名称 ${name} 已存在`);
    }

    if (tenantDomain) {
      const existingByDomain =
        await this.tenantRepository.findByDomain(tenantDomain);
      if (existingByDomain) {
        throw new ConflictException(`租户域名 ${domain} 已存在`);
      }
    }

    const tenant = Tenant.create(tenantName, tenantDomain, isActive);

    await this.tenantRepository.save(tenant);

    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new CreateTenantOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
