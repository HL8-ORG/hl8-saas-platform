import { SetMetadata } from '@nestjs/common';

/**
 * 多租户装饰器元数据键
 *
 * 用于标记需要多租户支持的控制器或路由。
 */
export const TENANT_METADATA_KEY = 'isTenantAware';

/**
 * 租户感知装饰器
 *
 * 标记控制器或路由方法需要多租户支持。
 * 被标记的路由会自动进行租户上下文验证和数据隔离。
 *
 * **使用场景**：
 * - 默认情况下，所有路由都需要租户上下文
 * - 对于不需要租户的路由（如租户注册、系统管理），使用 @PublicTenant() 跳过
 *
 * @decorator TenantAware
 * @example
 * ```typescript
 * @Controller('users')
 * @TenantAware() // 整个控制器需要租户支持
 * export class UsersController {
 *   @Get()
 *   async findAll() {
 *     // 自动过滤当前租户的数据
 *   }
 * }
 * ```
 */
export const TenantAware = () => SetMetadata(TENANT_METADATA_KEY, true);

/**
 * 公共租户路由装饰器
 *
 * 标记路由不需要租户上下文（如租户注册、系统管理接口）。
 *
 * @decorator PublicTenant
 * @example
 * ```typescript
 * @Controller('tenants')
 * export class TenantsController {
 *   @Post('register')
 *   @PublicTenant() // 租户注册不需要租户上下文
 *   async register() {
 *     // ...
 *   }
 * }
 * ```
 */
export const PublicTenant = () => SetMetadata(TENANT_METADATA_KEY, false);
