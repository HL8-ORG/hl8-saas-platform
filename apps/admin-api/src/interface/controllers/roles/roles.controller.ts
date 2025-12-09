import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateRoleCommand } from '../../../application/roles/commands/create-role.command';
import { GrantRolePermissionCommand } from '../../../application/roles/commands/grant-role-permission.command';
import { GetRolePermissionsQuery } from '../../../application/roles/queries/get-role-permissions.query';
import { GetRolesQuery } from '../../../application/roles/queries/get-roles.query';
import type { ITenantResolver } from '../../../application/shared/interfaces/tenant-resolver.interface';
import { Resource, ResourceGroup } from '../../../common/constants/resources';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '../../../lib/casbin';
import { AuthActionVerb, AuthPossession } from '../../../lib/casbin/types';
import { AddRolePermissionDto } from '../../dtos/roles/add-role-permission.dto';
import { CreateRoleDto } from '../../dtos/roles/create-role.dto';

/**
 * 角色控制器
 *
 * 处理角色相关的 REST API 请求。
 * 使用 CQRS 架构，通过 CommandBus 和 QueryBus 处理请求。
 *
 * **权限控制**：
 * - 所有路由都需要认证和授权
 * - 使用 UsePermissions 装饰器进行细粒度权限控制
 *
 * @class RolesController
 * @description 角色管理的 REST API 控制器（CQRS）
 */
@Controller('roles')
@UseGuards(AuthGuard, AuthZGuard)
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 查询所有角色
   *
   * 查询当前租户下的所有角色。
   *
   * @returns {Promise<any>} 角色列表
   */
  @Get()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLES_LIST,
    possession: AuthPossession.ANY,
  })
  async findAllRoles() {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(new GetRolesQuery(tenantId));
  }

  /**
   * 创建新角色
   *
   * 创建新的角色。
   *
   * @param {CreateRoleDto} createRoleDto - 创建角色数据
   * @returns {Promise<any>} 创建的角色
   */
  @Post()
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: ResourceGroup.ROLE,
    possession: AuthPossession.ANY,
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.commandBus.execute(
      new CreateRoleCommand(
        tenantId,
        createRoleDto.name,
        createRoleDto.displayName,
        createRoleDto.description,
      ),
    );
  }

  /**
   * 查询角色的所有权限
   *
   * 返回权限的简化格式（仅 resource 和 action）。
   *
   * @param {string} id - 角色 ID
   * @returns {Promise<any>} 权限列表
   */
  @Get(':id/permissions')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findRolePermissions(@Param('id') id: string) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(
      new GetRolePermissionsQuery(id, tenantId, false),
    );
  }

  /**
   * 查询角色的所有权限（包含完整信息）
   *
   * 返回权限的完整信息，包括描述等元数据。
   *
   * @param {string} id - 角色 ID
   * @returns {Promise<any>} 权限实体列表
   */
  @Get(':id/permissions/details')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findRolePermissionsWithDetails(@Param('id') id: string) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.queryBus.execute(
      new GetRolePermissionsQuery(id, tenantId, true),
    );
  }

  /**
   * 为角色授予权限
   *
   * @param {string} id - 角色 ID
   * @param {AddRolePermissionDto} addPermissionDto - 权限数据
   * @returns {Promise<any>} 授权结果
   */
  @Post(':id/permissions')
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async addRolePermission(
    @Param('id') id: string,
    @Body() addPermissionDto: AddRolePermissionDto,
  ) {
    const tenantId = this.tenantResolver.getCurrentTenantId();
    return this.commandBus.execute(
      new GrantRolePermissionCommand(
        id,
        tenantId,
        addPermissionDto.resource,
        addPermissionDto.operation,
        addPermissionDto.description,
      ),
    );
  }
}
