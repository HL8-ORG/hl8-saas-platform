import {
  Controller,
  ExecutionContext,
  Get,
  Inject,
  NotFoundException,
  Param,
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
import { Resource } from '../../roles/resources';
import { UsersService } from '../../users/users.service';

/**
 * 用户权限查询控制器
 *
 * 提供用户权限查询的 REST API 接口。
 *
 * @class UserPermissionsController
 * @description 用户权限查询 REST API 控制器
 */
@Controller('users')
@UseGuards(AuthGuard, AuthZGuard)
export class UserPermissionsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authzService: AuthZService,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 查询用户的所有权限
   *
   * 支持 OWN_ANY 权限检查：用户可以查看自己的权限，管理员可以查看任何用户的权限。
   * root 用户返回所有权限 ['*']。
   *
   * @param id - 用户 ID
   * @param userId - 当前登录用户 ID（从 JWT 中提取）
   * @returns 权限列表
   */
  @Get(':id/permissions')
  @UsePermissions({
    action: AuthActionVerb.READ,
    resource: Resource.USER_PERMISSIONS,
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
  async findUserPermissions(
    @Param('id') id: string,
    @GetUser('sub') userId: string,
  ) {
    const user = await this.usersService.getUserById(id);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // root 用户拥有所有权限
    if (user.email === 'root' || user.id === 'root') {
      return ['*'];
    }

    // 获取用户的所有权限（通过角色，传递租户ID以实现多租户隔离）
    // 注意：getPermissionsForUser 不支持 domain 参数，需要使用 getImplicitPermissionsForUser
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY] || user.tenantId;
    const permissions = await this.authzService.getImplicitPermissionsForUser(
      user.id,
      tenantId,
    );
    // 返回格式：[[subject, domain, resource, action], ...]
    // 我们需要提取 resource 和 action
    return permissions.map((p) => [p[2], p[3]]); // 返回 [resource, action]
  }
}
