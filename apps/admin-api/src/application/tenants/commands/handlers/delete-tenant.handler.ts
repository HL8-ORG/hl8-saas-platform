import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantRepository } from '../../../../domain/tenants/repositories/tenant.repository.interface';
import { DeleteTenantOutputDto } from '../../dtos/delete-tenant.input.dto';
import { DeleteTenantCommand } from '../delete-tenant.command';

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler implements ICommandHandler<DeleteTenantCommand> {
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTenantCommand): Promise<DeleteTenantOutputDto> {
    const { tenantId } = command;

    const tenantIdVo = new TenantId(tenantId);

    const tenant = await this.tenantRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    tenant.delete();

    await this.tenantRepository.delete(tenantIdVo);

    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new DeleteTenantOutputDto({
      message: '租户删除成功',
    });
  }
}
