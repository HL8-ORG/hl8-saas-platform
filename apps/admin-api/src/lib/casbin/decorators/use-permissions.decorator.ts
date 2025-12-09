import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { PERMISSIONS_METADATA } from '../authz.constants';
import { Permission, PermissionData } from '../interfaces/permission.interface';
import { AuthPossession, BatchApproval } from '../types';

/**
 * 默认的 isOwn 函数。
 *
 * 当权限配置中没有提供 `isOwn` 函数时使用。
 * 默认返回 false，表示不进行所有权检查。
 */
const defaultIsOwn = (ctx: ExecutionContext): boolean => false;

/**
 * 默认的资源提取函数。
 *
 * 当权限配置中没有提供 `resourceFromContext` 函数时使用。
 * 直接返回权限配置中的资源值。
 */
const defaultResourceFromContext = (
  ctx: ExecutionContext,
  perm: PermissionData,
) => perm.resource;

/**
 * 权限装饰器。
 *
 * 用于在控制器方法上声明所需的权限。
 * 可以定义多个权限，但只有当所有权限都满足时，才能访问该路由。
 *
 * 此装饰器会将权限配置存储为元数据，供 `AuthZGuard` 读取和验证。
 *
 * @param permissions - 权限配置数组，可以定义多个权限
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @UseGuards(AuthGuard(), AuthZGuard)
 *   @UsePermissions({
 *     action: AuthActionVerb.READ,
 *     resource: 'user',
 *     possession: AuthPossession.ANY,
 *   })
 *   async findAll() {
 *     return this.userService.findAll();
 *   }
 *
 *   @Get(':id')
 *   @UseGuards(AuthGuard(), AuthZGuard)
 *   @UsePermissions({
 *     action: AuthActionVerb.READ,
 *     resource: 'user',
 *     possession: AuthPossession.OWN,
 *     isOwn: (ctx) => {
 *       const request = ctx.switchToHttp().getRequest();
 *       return request.user.id === request.params.id;
 *     },
 *   })
 *   async findOne(@Param('id') id: string) {
 *     return this.userService.findOne(id);
 *   }
 * }
 * ```
 */
export const UsePermissions = (...permissions: Permission[]): any => {
  const perms = permissions.map((item) => {
    if (!item.possession) {
      item.possession = AuthPossession.ANY;
    }
    if (!item.isOwn) {
      item.isOwn = defaultIsOwn;
    }

    if (!item.resourceFromContext) {
      item.resourceFromContext = defaultResourceFromContext;
    }

    if (!item.batchApproval) {
      item.batchApproval = BatchApproval.ALL;
    }

    return item;
  });

  return SetMetadata(PERMISSIONS_METADATA, perms);
};
