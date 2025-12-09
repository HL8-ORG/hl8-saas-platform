import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { RoleName } from '../../../../domain/roles/value-objects/role-name.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { CreateRoleOutputDto } from '../../dtos/create-role.input.dto';
import { CreateRoleCommand } from '../create-role.command';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRoleCommand): Promise<CreateRoleOutputDto> {
    const { tenantId, name, displayName, description, isActive } = command;

    const tenantIdVo = new TenantId(tenantId);
    const roleName = new RoleName(name);

    const existing = await this.roleRepository.findByName(roleName, tenantIdVo);
    if (existing) {
      throw new ConflictException(`角色 ${name} 已存在`);
    }

    const role = Role.create(
      roleName,
      tenantIdVo,
      displayName,
      description,
      isActive,
    );

    await this.roleRepository.save(role);

    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new CreateRoleOutputDto({
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
