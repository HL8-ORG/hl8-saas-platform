import { SetMetadata } from '@nestjs/common';

/**
 * 公共路由元数据键
 *
 * 用于标识路由是否为公共访问（不需要认证）。
 *
 * @constant {string} isPublic
 */
export const isPublic = 'isPublic';

/**
 * 公共路由装饰器
 *
 * 用于标记控制器方法或类为公共访问，跳过 JWT 认证守卫。
 *
 * **使用场景**：
 * - 登录、注册等公开端点
 * - 健康检查端点
 * - 其他不需要认证的端点
 *
 * @function Public
 * @returns {ReturnType<typeof SetMetadata>} NestJS 元数据设置函数
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('/login')
 * async login() { ... }
 * ```
 */
export const Public = () => SetMetadata(isPublic, true);
