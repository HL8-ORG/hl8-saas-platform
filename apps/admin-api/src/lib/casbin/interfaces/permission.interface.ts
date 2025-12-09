import { ExecutionContext } from '@nestjs/common';
import {
  AuthActionVerb,
  AuthPossession,
  AuthResource,
  BatchApproval,
  CustomAuthActionVerb,
} from '../types';

/**
 * 权限配置接口。
 *
 * 用于定义控制器方法所需的权限要求。
 * 可以定义多个权限，所有权限都必须满足才能访问路由。
 */
export interface Permission {
  /**
   * 资源标识符。
   *
   * 可以是字符串（如 'user'、'role'）或对象（包含资源信息的对象）。
   */
  resource: AuthResource;

  /**
   * 操作动作。
   *
   * 可以是标准的 `AuthActionVerb`（create、read、update、delete）
   * 或自定义的动作字符串。
   */
  action: AuthActionVerb | CustomAuthActionVerb;

  /**
   * 所有权类型。
   *
   * 定义对资源的访问范围：
   * - ANY: 任何资源
   * - OWN: 仅自己的资源
   * - OWN_ANY: 自己的或任何资源
   *
   * @default AuthPossession.ANY
   */
  possession?: AuthPossession;

  /**
   * 判断资源是否属于当前用户的函数。
   *
   * 当 `possession` 为 OWN 或 OWN_ANY 时使用。
   * 用于检查请求的资源是否属于当前用户。
   *
   * @param ctx - NestJS 执行上下文
   * @returns 如果是自己的资源返回 true，否则返回 false
   *
   * @example
   * ```typescript
   * isOwn: (ctx) => {
   *   const request = ctx.switchToHttp().getRequest();
   *   return request.user.id === request.params.userId;
   * }
   * ```
   */
  isOwn?: (ctx: ExecutionContext) => boolean;

  /**
   * 资源提取方式。
   *
   * 可以是：
   * - `true`: 使用模块配置的默认 `resourceFromContext` 函数
   * - `false`: 使用权限配置中的 `resource` 值
   * - 函数: 使用自定义的资源提取函数
   *
   * @default false（使用配置的 resource 值）
   */
  resourceFromContext?: boolean | ResourceFromContextFn;

  /**
   * 批量审批策略。
   *
   * 当 `resource` 是数组时，定义审批策略：
   * - ANY: 任意一个资源通过即可
   * - ALL: 所有资源都必须通过
   *
   * @default BatchApproval.ALL
   */
  batchApproval?: BatchApproval;
}

/**
 * 权限数据类型。
 *
 * 排除了 `resourceFromContext` 和 `isOwn` 的权限配置，
 * 用于传递给资源提取函数。
 */
export type PermissionData = Omit<Permission, 'resourceFromContext' | 'isOwn'>;

/**
 * 资源提取函数类型。
 *
 * 用于从执行上下文中动态提取资源信息。
 *
 * @param context - NestJS 执行上下文
 * @param permission - 权限数据（不包含 resourceFromContext 和 isOwn）
 * @returns 资源标识符或资源数组
 */
export type ResourceFromContextFn = (
  context: ExecutionContext,
  permission: PermissionData,
) => AuthResource | AuthResource[];
