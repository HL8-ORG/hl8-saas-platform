/**
 * 授权模块选项的依赖注入令牌。
 *
 * 用于在 NestJS 依赖注入系统中标识授权模块的配置选项。
 */
export const AUTHZ_MODULE_OPTIONS = 'AUTHZ_MODULE_OPTIONS';

/**
 * Casbin Enforcer 的依赖注入令牌。
 *
 * 用于在 NestJS 依赖注入系统中标识 Casbin 策略执行器实例。
 */
export const AUTHZ_ENFORCER = 'AUTHZ_ENFORCER';

/**
 * 权限元数据的反射键。
 *
 * 用于在控制器方法上存储权限装饰器的元数据信息。
 */
export const PERMISSIONS_METADATA = '__PERMISSIONS__';
