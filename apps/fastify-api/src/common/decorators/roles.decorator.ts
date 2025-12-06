import { SetMetadata } from '@nestjs/common';

/**
 * 角色元数据键
 *
 * 用于标识路由所需的角色权限。
 *
 * @constant {string} ROLES_KEY
 */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 *
 * 用于为控制器方法或类设置所需的角色权限。
 * 只有拥有指定角色的用户才能访问被此装饰器标记的资源。
 *
 * **使用场景**：
 * - 管理员专用端点
 * - 需要特定角色的功能
 *
 * @function Roles
 * @param {...string[]} roles - 允许访问的角色列表
 * @returns {ReturnType<typeof SetMetadata>} NestJS 元数据设置函数
 *
 * @example
 * ```typescript
 * @Roles('ADMIN')
 * @Get('/admin/users')
 * async getUsers() { ... }
 *
 * @Roles('ADMIN', 'MODERATOR')
 * @Post('/admin/posts')
 * async createPost() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
