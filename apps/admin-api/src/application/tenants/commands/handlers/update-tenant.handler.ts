import { ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantDomain } from '../../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../../domain/tenants/value-objects/tenant-name.vo';
import { UpdateTenantOutputDto } from '../../dtos/update-tenant.input.dto';
import { UpdateTenantCommand } from '../update-tenant.command';

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateTenantCommand): Promise<UpdateTenantOutputDto> {
    const { tenantId, name, domain, isActive } = command;

    const tenantIdVo = new TenantId(tenantId);

    const tenant = await this.tenantRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    if (name !== undefined) {
      const tenantName = new TenantName(name);
      if (!tenantName.equals(tenant.name)) {
        const existingByName =
          await this.tenantRepository.findByName(tenantName);
        if (existingByName) {
          throw new ConflictException(`租户名称 ${name} 已存在`);
        }
      }
    }

    if (domain !== undefined) {
      const tenantDomain = domain ? new TenantDomain(domain) : null;
      const currentDomain = tenant.domain;

      const domainChanged =
        (tenantDomain === null && currentDomain !== null) ||
        (tenantDomain !== null && currentDomain === null) ||
        (tenantDomain !== null &&
          currentDomain !== null &&
          !tenantDomain.equals(currentDomain));

      if (domainChanged) {
        if (tenantDomain) {
          const existingByDomain =
            await this.tenantRepository.findByDomain(tenantDomain);
          if (existingByDomain) {
            throw new ConflictException(`租户域名 ${domain} 已存在`);
          }
        }
      }
    }

    const tenantName = name !== undefined ? new TenantName(name) : undefined;
    const tenantDomain =
      domain !== undefined
        ? domain
          ? new TenantDomain(domain)
          : null
        : undefined;

    tenant.update(tenantName, tenantDomain);

    if (isActive !== undefined) {
      if (isActive && !tenant.isActive) {
        tenant.activate();
      } else if (!isActive && tenant.isActive) {
        tenant.deactivate();
      }
    }

    await this.tenantRepository.save(tenant);

    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new UpdateTenantOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
