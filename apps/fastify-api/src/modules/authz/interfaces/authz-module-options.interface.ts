import {
  DynamicModule,
  ExecutionContext,
  ForwardReference,
  Provider,
  Type,
} from '@nestjs/common';
import { AuthUser, BatchApproval } from '../types';
import { ResourceFromContextFn } from './permission.interface';

/**
 * 授权模块配置选项接口。
 *
 * 用于配置 AuthZModule 的行为，包括 Casbin 模型、策略、用户提取函数等。
 *
 * @template T - 策略数据的类型（当 policy 是 Promise 时）
 */
export interface AuthZModuleOptions<T = any> {
  /**
   * Casbin 模型文件路径。
   *
   * 如果提供了 `enforcerProvider`，则此选项可选。
   * 例如：'model.conf'
   */
  model?: string;

  /**
   * Casbin 策略文件路径或策略数据。
   *
   * 可以是：
   * - 字符串：策略文件路径（如 'policy.csv'）
   * - Promise：异步加载的策略数据
   *
   * 如果提供了 `enforcerProvider`，则此选项可选。
   */
  policy?: string | Promise<T>;

  /**
   * 是否启用所有权（Possession）功能。
   *
   * 当为 true 时，支持 OWN/ANY 所有权检查。
   * 当为 false 时，忽略所有权，只检查基本权限。
   *
   * @default true
   */
  enablePossession?: boolean;

  /**
   * 从执行上下文中提取用户信息的函数。
   *
   * 此函数必须实现，用于从请求上下文中获取当前用户信息。
   * 返回的用户信息可以是字符串（用户名）或对象（包含用户信息的对象）。
   *
   * @param context - NestJS 执行上下文
   * @returns 用户信息（用户名或用户对象）
   *
   * @example
   * ```typescript
   * userFromContext: (ctx: ExecutionContext) => {
   *   const request = ctx.switchToHttp().getRequest();
   *   return request.user; // 或 request.user.username
   * }
   * ```
   */
  userFromContext: (context: ExecutionContext) => AuthUser;

  /**
   * 从执行上下文中提取资源信息的函数。
   *
   * 可选，用于动态从请求上下文中提取资源信息。
   * 例如：从 URL 参数中提取资源 ID。
   *
   * @param context - NestJS 执行上下文
   * @param permission - 权限数据
   * @returns 资源信息
   *
   * @example
   * ```typescript
   * resourceFromContext: (ctx, { resource, action }) => {
   *   const request = ctx.switchToHttp().getRequest();
   *   return `${resource}:${request.params.id}`;
   * }
   * ```
   */
  resourceFromContext?: ResourceFromContextFn;

  /**
   * 批量审批策略。
   *
   * 当权限检查涉及多个资源时，定义审批策略：
   * - ANY: 任意一个资源通过即可
   * - ALL: 所有资源都必须通过
   *
   * @default BatchApproval.ALL
   */
  batchApproval?: BatchApproval;

  /**
   * Casbin Enforcer 提供者。
   *
   * 如果提供此选项，将使用自定义的 Enforcer 实例。
   * 此时 `model` 和 `policy` 选项将被忽略。
   *
   * @example
   * ```typescript
   * enforcerProvider: {
   *   provide: AUTHZ_ENFORCER,
   *   useFactory: async (configSrv: ConfigService, orm: MikroORM) => {
   *     const adapter = await MikroORMAdapter.newAdapter({ connection: orm });
   *     return await casbin.newEnforcer('model.conf', adapter);
   *   },
   *   inject: [ConfigService, MikroORM],
   * }
   * ```
   */
  enforcerProvider?: Provider<any>;

  /**
   * 需要导入的模块列表。
   *
   * 用于导入导出所需提供者的模块。
   * 例如：如果 `enforcerProvider` 需要 `ConfigService`，则需要导入 `ConfigModule`。
   */
  imports?: Array<
    Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
  >;
}
