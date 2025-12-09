import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePermissionCommand } from '../../../application/permissions/commands/create-permission.command';
import { GetPermissionsQuery } from '../../../application/permissions/queries/get-permissions.query';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { Resource, ResourceGroup } from '../../../common/constants/resources';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '../../../lib/casbin';
import { AuthActionVerb, AuthPossession } from '../../../lib/casbin/types';
import { CreatePermissionDto } from '../../dtos/permissions/create-permission.dto';

/**
 * 权限控制器
 *
 * 处理权限相关的 REST API 请求。
 *
 * @class PermissionsController
 */
@Controller('permissions')
@UseGuards(AuthGuard, AuthZGuard)
export class PermissionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 创建权限
   *
   * @param {CreatePermissionDto} createPermissionDto
   * @returns {Promise<any>}
   */
  @Post()
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: ResourceGroup.PERMISSION,
    possession: AuthPossession.ANY,
  })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.commandBus.execute(
      new CreatePermissionCommand(
        tenantId,
        createPermissionDto.resource,
        createPermissionDto.action,
        createPermissionDto.description,
      ),
    );
  }

  /**
   * 查询所有权限
   *
   * @returns {Promise<any>}
   */
  @Get()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.PERMISSIONS_LIST,
    possession: AuthPossession.ANY,
  })
  async getPermissions() {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(new GetPermissionsQuery(tenantId));
  }
}
