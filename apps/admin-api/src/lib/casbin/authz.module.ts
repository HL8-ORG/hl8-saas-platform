import { DynamicModule, Global, Module } from '@nestjs/common';
import * as casbin from 'casbin';

import { AUTHZ_ENFORCER, AUTHZ_MODULE_OPTIONS } from './authz.constants';
import { AuthZGuard } from './authz.guard';
import { AuthZModuleOptions } from './interfaces';
import { AuthZService } from './services';

/**
 * 授权模块。
 *
 * 提供基于 Casbin 的权限控制功能，包括：
 * - 权限守卫（AuthZGuard）
 * - 通用授权服务（AuthZService）
 *
 * 这是一个全局模块，注册后可在整个应用中使用。
 *
 * @example
 * ```typescript
 * AuthZModule.register({
 *   imports: [ConfigModule],
 *   enforcerProvider: {
 *     provide: AUTHZ_ENFORCER,
 *     useFactory: async (configSrv: ConfigService, orm: MikroORM) => {
 *       const config = await configSrv.getAuthConfig();
 *       const adapter = await MikroORMAdapter.newAdapter({ connection: orm });
 *       return await casbin.newEnforcer(config.model, adapter);
 *     },
 *     inject: [ConfigService, MikroORM],
 *   },
 *   userFromContext: (ctx: ExecutionContext) => {
 *     const request = ctx.switchToHttp().getRequest();
 *     return request.user;
 *   },
 * })
 * ```
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class AuthZModule {
  /**
   * 注册授权模块。
   *
   * 配置 Casbin Enforcer 和用户上下文提取函数，创建动态模块。
   *
   * @param options - 模块配置选项
   * @returns 动态模块配置
   *
   * @throws {Error} 当既没有提供 enforcerProvider，也没有提供 model 和 policy 时抛出
   *
   * @example
   * ```typescript
   * AuthZModule.register({
   *   enforcerProvider: {
   *     provide: AUTHZ_ENFORCER,
   *     useFactory: async () => {
   *       const adapter = await MikroORMAdapter.newAdapter({ connection: orm });
   *       return await casbin.newEnforcer('model.conf', adapter);
   *     },
   *   },
   *   userFromContext: (ctx) => {
   *     return ctx.switchToHttp().getRequest().user;
   *   },
   * })
   * ```
   */
  static register(options: AuthZModuleOptions): DynamicModule {
    if (options.enablePossession === undefined) {
      options.enablePossession = true;
    }

    const moduleOptionsProvider = {
      provide: AUTHZ_MODULE_OPTIONS,
      useValue: options || {},
    };

    let enforcerProvider = options.enforcerProvider;
    const importsModule = options.imports || [];

    if (!enforcerProvider) {
      if (!options.model || !options.policy) {
        throw new Error(
          'must provide either enforcerProvider or both model and policy',
        );
      }

      enforcerProvider = {
        provide: AUTHZ_ENFORCER,
        useFactory: async () => {
          const isFile = typeof options.policy === 'string';

          let policyOption;

          if (isFile) {
            policyOption = options.policy as string;
          } else {
            policyOption = await options.policy;
          }

          return casbin.newEnforcer(options.model, policyOption);
        },
      };
    }

    return {
      module: AuthZModule,
      providers: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZService,
      ],
      imports: importsModule,
      exports: [
        moduleOptionsProvider,
        enforcerProvider,
        AuthZGuard,
        AuthZService,
      ],
    };
  }
}
