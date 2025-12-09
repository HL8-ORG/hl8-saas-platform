import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Permission } from '../../../../domain/permissions/entities/permission.aggregate';
import type { IPermissionRepository } from '../../../../domain/permissions/repositories/permission.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { CreatePermissionOutputDto } from '../../dtos/create-permission.input.dto';
import { CreatePermissionCommand } from '../create-permission.command';

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler implements ICommandHandler<CreatePermissionCommand> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreatePermissionCommand,
  ): Promise<CreatePermissionOutputDto> {
    const { tenantId, resource, action, description } = command;
    const tenantIdVo = new TenantId(tenantId);

    const existingPermission =
      await this.permissionRepository.findByResourceAndAction(
        resource,
        action,
        tenantIdVo,
      );

    if (existingPermission) {
      throw new ConflictException(
        `Permission with resource '${resource}' and action '${action}' already exists.`,
      );
    }

    const permission = Permission.create(
      resource,
      action,
      tenantIdVo,
      description,
    );

    await this.permissionRepository.save(permission);

    const domainEvents = permission.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      permission.commit();
    }

    return new CreatePermissionOutputDto({
      id: permission.id.toString(),
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }
}
