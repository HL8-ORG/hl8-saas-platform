import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Permission } from '../../../domain/permissions/entities/permission.aggregate';
import type { IPermissionRepository } from '../../../domain/permissions/repositories/permission.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  CreatePermissionInputDto,
  CreatePermissionOutputDto,
} from '../dtos/create-permission.input.dto';

@Injectable()
export class CreatePermissionUseCase implements IUseCase<
  CreatePermissionInputDto,
  CreatePermissionOutputDto
> {
  constructor(
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    input: CreatePermissionInputDto,
  ): Promise<CreatePermissionOutputDto> {
    const { tenantId, resource, action, description } = input;
    const tenantIdVo = new TenantId(tenantId);

    // Check if permission already exists
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

    // Create permission
    const permission = Permission.create(
      resource,
      action,
      tenantIdVo,
      description,
    );

    // Save permission
    await this.permissionRepository.save(permission);

    // Publish events
    const events = permission.getUncommittedEvents();
    if (events.length > 0) {
      await this.eventBus.publishAll(events);
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
