import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { RoleId } from '../../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { AuthZService } from '../../../../lib/casbin/services/authz.service';
import type { IPermissionsService } from '../../../shared/interfaces/permissions-service.interface';
import { GrantRolePermissionOutputDto } from '../../dtos/grant-role-permission.input.dto';
import { GrantRolePermissionCommand } from '../grant-role-permission.command';

@CommandHandler(GrantRolePermissionCommand)
export class GrantRolePermissionHandler implements ICommandHandler<GrantRolePermissionCommand> {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    private readonly eventBus: EventBus,
    private readonly authzService: AuthZService,
    @Inject('IPermissionsService')
    private readonly permissionsService: IPermissionsService,
  ) {}

  async execute(
    command: GrantRolePermissionCommand,
  ): Promise<GrantRolePermissionOutputDto> {
    const { roleId, tenantId, resource, action, description } = command;

    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    const role = await this.roleRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (!role.isActive) {
      throw new BadRequestException(`角色 ${role.name.value} 未激活`);
    }

    const permission = await this.permissionsService.createOrGet({
      resource,
      action,
      description,
    });

    await this.permissionsService.assignPermissionToRole(
      role.id.toString(),
      permission.id,
    );

    const success = await this.authzService.addPolicy(
      role.name.value,
      tenantId,
      resource,
      action,
    );

    role.grantPermission(resource, action);
    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new GrantRolePermissionOutputDto({
      success,
      message: success ? '权限授予成功' : '权限授予失败',
    });
  }
}
