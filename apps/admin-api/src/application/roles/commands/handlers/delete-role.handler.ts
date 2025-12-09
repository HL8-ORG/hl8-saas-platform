import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { DeleteRoleOutputDto } from '../../dtos/delete-role.input.dto';
import { DeleteRoleCommand } from '../delete-role.command';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<DeleteRoleOutputDto> {
    const { roleId, tenantId } = command;

    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    const role = await this.roleRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    role.delete();

    await this.roleRepository.delete(roleIdVo, tenantIdVo);

    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new DeleteRoleOutputDto({
      message: '角色删除成功',
    });
  }
}
