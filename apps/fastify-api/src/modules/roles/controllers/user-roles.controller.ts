import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from '../../../common/constants/tenant.constants';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { AuthZGuard, UsePermissions } from '../../authz';
import { AuthZService } from '../../authz/services/authz.service';
import { AuthActionVerb, AuthPossession } from '../../authz/types';
import { UsersService } from '../../users/users.service';
import { AssignUserRoleDto } from '../dtos/assign-user-role.dto';
import { Resource } from '../resources';
import { RolesService } from '../services/roles.service';

/**
 * 用户角色管理控制器
 *
 * 提供用户角色管理的 REST API 接口，包括：
 * - 查询用户的角色列表
 * - 为用户分配角色
 * - 取消用户的角色分配
 *
 * @class UserRolesController
 * @description 用户角色管理 REST API 控制器
 */
@Controller('users')
@UseGuards(AuthGuard, AuthZGuard)
export class UserRolesController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly authzService: AuthZService,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 查询用户的所有角色
   *
   * 支持 OWN_ANY 权限检查：用户可以查看自己的角色，管理员可以查看任何用户的角色。
   *
   * @param id - 用户 ID
   * @param userId - 当前登录用户 ID（从 JWT 中提取）
   * @returns 角色名称列表
   */
  @Get(':id/roles')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.USER_ROLES,
    possession: AuthPossession.OWN_ANY,
    isOwn: (ctx: ExecutionContext): boolean => {
      const request = ctx.switchToHttp().getRequest<{
        user?: { sub?: string };
        params?: { id?: string };
      }>();
      const currentUserId = request.user?.sub;
      const targetUserId = request.params?.id;
      return currentUserId === targetUserId;
    },
  })
  async findUserRoles(@Param('id') id: string, @GetUser('sub') userId: string) {
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 使用 AuthZService 获取用户角色（传递租户ID以实现多租户隔离）
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY] || user.tenantId;
    return await this.authzService.getRolesForUser(user.id, tenantId);
  }

  /**
   * 为用户分配角色
   *
   * @param id - 用户 ID
   * @param assignRoleDto - 角色分配数据
   * @returns 分配结果
   */
  @Post(':id/roles')
  @UsePermissions({
    action: AuthActionVerb.CREATE,
    resource: Resource.USER_ROLES,
    possession: AuthPossession.ANY,
  })
  async assignUserRole(
    @Param('id') id: string,
    @Body() assignRoleDto: AssignUserRoleDto,
  ) {
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 防止修改 root 用户的角色（如果存在）
    if (user.email === 'root' || user.id === 'root') {
      throw new BadRequestException('内置 root 用户的角色不能修改');
    }

    return await this.rolesService.assignUser(id, assignRoleDto.roleName);
  }

  /**
   * 取消用户的角色分配
   *
   * @param id - 用户 ID
   * @param roleId - 角色 ID
   * @returns 取消分配结果
   */
  @Delete(':id/roles/:roleId')
  @UsePermissions({
    action: AuthActionVerb.DELETE,
    resource: Resource.USER_ROLES,
    possession: AuthPossession.ANY,
  })
  async deAssignUserRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    const [user, role] = await Promise.all([
      this.usersService.getUserById(id),
      this.rolesService.findById(roleId),
    ]);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return await this.rolesService.deAssignUser(id, role.name);
  }
}
