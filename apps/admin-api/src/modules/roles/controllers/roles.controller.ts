import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '../../authz';
import { AuthActionVerb, AuthPossession } from '../../authz/types';
import { AddRolePermissionDto } from '../dtos/add-role-permission.dto';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { Resource, ResourceGroup } from '../resources';
import { RolesService } from '../services/roles.service';

/**
 * 角色管理控制器
 *
 * 提供角色管理的 REST API 接口，包括：
 * - 查询角色列表
 * - 创建角色
 * - 查询角色权限
 * - 为角色授予权限
 *
 * @class RolesController
 * @description 角色管理 REST API 控制器
 */
@Controller('roles')
@UseGuards(AuthGuard, AuthZGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * 查询所有角色
   *
   * @returns 角色列表
   */
  @Get()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLES_LIST,
    possession: AuthPossession.ANY,
  })
  async findAllRoles() {
    return await this.rolesService.findAllRoles();
  }

  /**
   * 创建新角色
   *
   * @param createRoleDto - 创建角色数据
   * @returns 创建的角色
   */
  @Post()
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: ResourceGroup.ROLE,
    possession: AuthPossession.ANY,
  })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.rolesService.addRole(createRoleDto);
  }

  /**
   * 查询角色的所有权限
   *
   * 返回权限的简化格式（仅 resource 和 action）。
   *
   * @param id - 角色 ID
   * @returns 权限列表（格式：[[resource, action], ...]）
   */
  @Get(':id/permissions')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findRolePermissions(@Param('id') id: string) {
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return await this.rolesService.rolePermissions(role.name);
  }

  /**
   * 查询角色的所有权限（包含完整信息）
   *
   * 返回权限的完整信息，包括描述等元数据。
   *
   * @param id - 角色 ID
   * @returns 权限实体列表
   */
  @Get(':id/permissions/details')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findRolePermissionsWithDetails(@Param('id') id: string) {
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return await this.rolesService.getRolePermissionsWithDetails(role.id);
  }

  /**
   * 为角色授予权限
   *
   * @param id - 角色 ID
   * @param addPermissionDto - 权限数据
   * @returns 授权结果
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
    const role = await this.rolesService.findById(id);

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return await this.rolesService.grantPermission(
      role.name,
      addPermissionDto.operation,
      addPermissionDto.resource,
    );
  }
}
