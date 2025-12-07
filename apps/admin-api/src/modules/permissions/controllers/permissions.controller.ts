import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '../../authz';
import { AuthActionVerb, AuthPossession } from '../../authz/types';
import { Resource, ResourceGroup } from '../../roles/resources';
import { PermissionsService } from '../services/permissions.service';

/**
 * 权限管理控制器
 *
 * 提供权限管理的 REST API 接口，包括：
 * - 查询权限列表
 * - 创建权限
 * - 更新权限描述
 * - 删除权限
 *
 * @class PermissionsController
 * @description 权限管理 REST API 控制器
 */
@Controller('permissions')
@UseGuards(AuthGuard, AuthZGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * 查询所有权限
   *
   * @param tenantId - 租户 ID（可选，用于多租户场景）
   * @returns 权限列表
   */
  @Get()
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findAllPermissions(@Query('tenantId') tenantId?: string) {
    return await this.permissionsService.findAll(tenantId);
  }

  /**
   * 根据 ID 查询权限
   *
   * @param id - 权限 ID
   * @returns 权限实体
   */
  @Get(':id')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async findPermissionById(@Param('id') id: string) {
    const permission = await this.permissionsService.findById(id);
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  /**
   * 创建权限
   *
   * 如果权限已存在（相同的 resource + action + tenantId），则返回现有权限。
   *
   * @param createPermissionDto - 创建权限数据
   * @returns 权限实体
   */
  @Post()
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: ResourceGroup.ROLE,
    possession: AuthPossession.ANY,
  })
  async createPermission(
    @Body()
    createPermissionDto: {
      resource: string;
      action: string;
      description?: string;
      tenantId?: string;
    },
  ) {
    return await this.permissionsService.createOrGet(createPermissionDto);
  }

  /**
   * 更新权限描述
   *
   * @param id - 权限 ID
   * @param updateDto - 更新数据
   * @returns 更新后的权限实体
   */
  @Put(':id/description')
  @UsePermissions({
    action: AuthActionVerb.UPDATE,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async updatePermissionDescription(
    @Param('id') id: string,
    @Body() updateDto: { description: string },
  ) {
    return await this.permissionsService.updateDescription(
      id,
      updateDto.description,
    );
  }

  /**
   * 删除权限
   *
   * 只能删除未被任何角色使用的权限。
   *
   * @param id - 权限 ID
   * @returns 删除结果
   */
  @Delete(':id')
  @UsePermissions({
    action: AuthActionVerb.DELETE,
    resource: Resource.ROLE_PERMISSIONS,
    possession: AuthPossession.ANY,
  })
  async deletePermission(@Param('id') id: string) {
    await this.permissionsService.delete(id);
    return { message: '权限删除成功' };
  }
}
