import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 带用户信息的请求接口
 *
 * 定义包含用户信息的请求对象结构。
 *
 * @interface RequestWithUser
 */
interface RequestWithUser {
  /** 用户信息对象（JWT 载荷） */
  user?: Record<string, unknown>;
}

/**
 * 获取用户装饰器
 *
 * 用于从请求中提取用户信息（JWT 载荷）。
 * 如果指定了属性名，则返回该属性的值；否则返回完整的用户对象。
 *
 * **使用场景**：
 * - 获取当前登录用户信息
 * - 获取用户 ID、角色等特定属性
 *
 * @function GetUser
 * @param {string | undefined} data - 可选的用户属性名（如 'sub'、'role' 等）
 * @param {ExecutionContext} ctx - 执行上下文
 * @returns {unknown} 用户对象或指定属性的值
 *
 * @example
 * ```typescript
 * @Get('/me')
 * async getMe(@GetUser('sub') userId: string) {
 *   // userId 是 JWT 载荷中的 sub 字段
 * }
 *
 * @Get('/profile')
 * async getProfile(@GetUser() user: Record<string, unknown>) {
 *   // user 是完整的 JWT 载荷对象
 * }
 * ```
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data && user ? user[data] : user;
  },
);
