import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as casbin from 'casbin';
import {
  AUTHZ_ENFORCER,
  AUTHZ_MODULE_OPTIONS,
  PERMISSIONS_METADATA,
} from './authz.constants';
import type { AuthZModuleOptions } from './interfaces/authz-module-options.interface';
import {
  Permission,
  ResourceFromContextFn,
} from './interfaces/permission.interface';
import { AuthPossession, AuthResource, AuthUser, BatchApproval } from './types';

/**
 * 授权守卫。
 *
 * 实现 NestJS 的 `CanActivate` 接口，用于在路由处理前进行权限检查。
 * 通过反射机制获取控制器方法上的权限装饰器元数据，然后使用 Casbin Enforcer
 * 进行权限验证。
 *
 * 功能特性：
 * - 支持单个和批量权限检查
 * - 支持资源所有权控制（OWN/ANY）
 * - 支持从上下文动态提取资源信息
 * - 支持批量审批策略（ANY/ALL）
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
 * }
 * ```
 */
@Injectable()
export class AuthZGuard implements CanActivate {
  /**
   * 构造函数。
   *
   * @param reflector - NestJS 反射器，用于获取元数据
   * @param enforcer - Casbin 策略执行器，用于权限验证
   * @param options - 授权模块配置选项
   */
  constructor(
    protected readonly reflector: Reflector,
    @Inject(AUTHZ_ENFORCER) protected enforcer: casbin.Enforcer,
    @Inject(AUTHZ_MODULE_OPTIONS) protected options: AuthZModuleOptions,
  ) {}

  /**
   * 检查是否可以激活路由。
   *
   * 这是 NestJS 守卫的核心方法，在路由处理前被调用。
   * 流程：
   * 1. 从方法元数据中获取权限配置
   * 2. 如果没有权限配置，直接允许访问
   * 3. 从上下文中提取用户信息
   * 4. 对每个权限配置进行验证
   * 5. 所有权限都通过时返回 true，否则抛出异常
   *
   * @param context - 执行上下文，包含请求和响应信息
   * @returns 如果权限检查通过返回 true，否则抛出 UnauthorizedException
   *
   * @throws {UnauthorizedException} 当用户未认证或权限不足时抛出
   *
   * @example
   * ```typescript
   * // 在控制器方法上使用
   * @UseGuards(AuthZGuard)
   * @UsePermissions({
   *   action: 'read:any',
   *   resource: 'user',
   * })
   * async getUsers() { ... }
   * ```
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions: Permission[] = this.reflector.get<Permission[]>(
      PERMISSIONS_METADATA,
      context.getHandler(),
    );

    if (!permissions) {
      return true;
    }

    const requestUser = this.options.userFromContext(context);

    if (!requestUser) {
      throw new UnauthorizedException();
    }

    /**
     * 检查用户是否具有指定权限。
     *
     * 内部辅助函数，用于验证单个权限配置。
     * 处理资源提取、所有权检查和权限执行。
     *
     * @param user - 用户信息（用户名或用户对象）
     * @param permission - 权限配置对象
     * @returns 如果用户具有权限返回 true，否则返回 false
     */
    const hasPermission = async (
      user: AuthUser,
      permission: Permission,
    ): Promise<boolean> => {
      const {
        possession,
        resource,
        action,
        resourceFromContext,
        batchApproval,
      } = permission;

      // 从上下文或配置中提取资源信息
      let contextResource: AuthResource;
      if (resourceFromContext === true) {
        if (this.options.resourceFromContext) {
          // 使用模块配置的默认资源提取函数
          contextResource = this.options.resourceFromContext(context, {
            possession,
            resource,
            action,
          });
        } else {
          // 如果没有配置，使用权限配置中的资源
          contextResource = resource;
        }
      } else {
        // 使用权限配置中的自定义资源提取函数
        contextResource = (resourceFromContext as ResourceFromContextFn)(
          context,
          { possession, resource, action },
        );
      }

      const batchApprovalPolicy = batchApproval ?? this.options.batchApproval;

      // 如果禁用了所有权功能，直接执行权限检查
      if (!this.options.enablePossession) {
        return this.enforce(user, contextResource, action, batchApprovalPolicy);
      }

      // 处理所有权检查
      const poss: AuthPossession[] = [];

      if (possession === AuthPossession.OWN_ANY) {
        // OWN_ANY 需要检查两种所有权类型
        poss.push(AuthPossession.ANY, AuthPossession.OWN);
      } else if (possession) {
        poss.push(possession);
      } else {
        // 如果没有指定 possession，默认使用 ANY
        poss.push(AuthPossession.ANY);
      }

      // 从 user 对象中提取 tenantId（如果 user 是对象）
      let tenantId: string | undefined;
      if (typeof user === 'object' && user !== null) {
        tenantId = (user as any)?.tenantId;
      }

      // 对每种所有权类型进行检查，任意一种通过即可
      return AuthZGuard.asyncSome<AuthPossession>(poss, async (p) => {
        if (p === AuthPossession.OWN) {
          // 检查是否是自己的资源
          return (permission as any).isOwn(context);
        } else {
          // 检查是否有 ANY 权限
          return this.enforce(
            user,
            contextResource,
            `${action}:${p}`,
            batchApprovalPolicy,
            tenantId,
          );
        }
      });
    };

    const result = await AuthZGuard.asyncEvery<Permission>(
      permissions,
      async (permission) => hasPermission(requestUser, permission),
    );

    return result;
  }

  /**
   * 执行权限检查。
   *
   * 调用 Casbin Enforcer 进行实际的权限验证。
   * 支持单个资源和批量资源检查。
   * 支持多租户场景，通过 domain 参数进行租户隔离。
   *
   * @param user - 用户信息（用户名或用户对象，如果是对象应包含 tenantId）
   * @param resource - 资源标识符或资源数组
   * @param action - 操作动作（如 'read:any'、'write:own'）
   * @param batchApprovalPolicy - 批量审批策略（ANY: 任意一个通过即可，ALL: 全部通过才可）
   * @param domain - 租户 ID（可选，如果未提供则从 user 对象中提取）
   * @returns 如果权限检查通过返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * // 单个资源检查
   * const allowed = await guard.enforce('alice', 'user', 'read:any', undefined, 'tenant_default');
   *
   * // 批量资源检查
   * const allowed = await guard.enforce(
   *   'alice',
   *   ['user', 'role'],
   *   'read:any',
   *   BatchApproval.ALL,
   *   'tenant_default'
   * );
   * ```
   */
  async enforce(
    user: AuthUser,
    resource: AuthResource | AuthResource[],
    action: string,
    batchApprovalPolicy?: BatchApproval,
    domain?: string,
  ): Promise<boolean> {
    // 从 user 对象中提取 username（如果是对象）
    const username =
      typeof user === 'string' ? user : (user as any)?.username || user;

    // 从 user 对象中提取 tenantId（如果未提供 domain 参数）
    let tenantId = domain;
    if (!tenantId && typeof user === 'object' && user !== null) {
      tenantId = (user as any)?.tenantId;
    }

    // 如果仍然没有 tenantId，尝试从请求上下文获取（用于 Guard 场景）
    if (!tenantId) {
      // 注意：在 Guard 中无法直接访问 request，但可以通过 user 对象传递
      // 如果 user 对象中没有 tenantId，说明可能存在问题
      // 这里不再使用硬编码的默认值，而是抛出异常或返回 false
      // 因为多租户场景下，租户ID是必需的
    }

    // 如果仍然没有 tenantId，说明租户上下文缺失
    if (!tenantId) {
      // 在多租户场景下，没有租户ID应该拒绝访问
      return false;
    }

    if (Array.isArray(resource)) {
      // 批量权限检查：根据批量审批策略决定结果
      // 模型支持 domain，所以 enforce 调用格式为: [username, domain, resource, action]
      const checks = resource.map((res) => [username, tenantId, res, action]);
      const results = await this.enforcer.batchEnforce(checks);

      if (batchApprovalPolicy === BatchApproval.ANY) {
        // 任意一个通过即可
        return results.some((result) => result);
      }

      // 全部通过才可
      return results.every((result) => result);
    }

    // 单个资源权限检查
    // 模型支持 domain，所以 enforce 调用格式为: enforce(username, domain, resource, action)
    return this.enforcer.enforce(username, tenantId, resource, action);
  }

  /**
   * 异步的 "some" 操作。
   *
   * 对数组中的每个元素执行异步回调，如果任意一个回调返回 true，则立即返回 true。
   * 类似于 Array.some()，但支持异步回调。
   *
   * @param array - 要遍历的数组
   * @param callback - 异步回调函数，返回 Promise<boolean>
   * @returns 如果任意一个元素满足条件返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const hasPermission = await AuthZGuard.asyncSome(
   *   [AuthPossession.ANY, AuthPossession.OWN],
   *   async (pos) => await checkPermission(pos)
   * );
   * ```
   */
  static async asyncSome<T>(
    array: T[],
    callback: (value: T, index: number, a: T[]) => Promise<boolean>,
  ): Promise<boolean> {
    for (let i = 0; i < array.length; i++) {
      const result = await callback(array[i], i, array);
      if (result) {
        return result;
      }
    }

    return false;
  }

  /**
   * 异步的 "every" 操作。
   *
   * 对数组中的每个元素执行异步回调，如果所有回调都返回 true，则返回 true。
   * 如果任意一个回调返回 false，则立即返回 false。
   * 类似于 Array.every()，但支持异步回调。
   *
   * @param array - 要遍历的数组
   * @param callback - 异步回调函数，返回 Promise<boolean>
   * @returns 如果所有元素都满足条件返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * const allAllowed = await AuthZGuard.asyncEvery(
   *   permissions,
   *   async (permission) => await checkPermission(permission)
   * );
   * ```
   */
  static async asyncEvery<T>(
    array: T[],
    callback: (value: T, index: number, a: T[]) => Promise<boolean>,
  ): Promise<boolean> {
    for (let i = 0; i < array.length; i++) {
      const result = await callback(array[i], i, array);
      if (!result) {
        return result;
      }
    }

    return true;
  }
}
