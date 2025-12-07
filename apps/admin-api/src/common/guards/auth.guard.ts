import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import { COOKIE_CONFIG } from '../constants/cookie.config';
import { TENANT_CONTEXT_KEY } from '../constants/tenant.constants';

/**
 * JWT 认证守卫
 *
 * 实现了 `CanActivate` 接口，用于验证 JWT 访问令牌。
 * 从 Cookie 中提取访问令牌，验证后将其载荷附加到请求对象上。
 *
 * **工作流程**：
 * 1. 检查路由是否标记为公共访问（@Public()），如果是则允许通过
 * 2. 从 Cookie 中提取访问令牌（优先）
 * 3. 如果 Cookie 中没有，则从 Authorization header 中提取 Bearer token（备选）
 * 4. 验证令牌的有效性和签名
 * 5. 将令牌载荷附加到请求对象，供后续使用
 *
 * **安全特性**：
 * - 支持公共路由标记，跳过认证
 * - 令牌验证失败时抛出明确的异常
 *
 * @class AuthGuard
 * @implements {CanActivate}
 * @description JWT 访问令牌认证守卫
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * 构造函数
   *
   * 注入 JWT 服务、配置服务和反射器依赖。
   *
   * @param {JwtService} jwtService - JWT 服务，用于验证令牌
   * @param {ConfigService} config - 配置服务，用于读取 JWT 密钥
   * @param {Reflector} reflector - 反射器，用于读取路由元数据
   */
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private reflector: Reflector,
  ) {}

  /**
   * 确定当前请求是否允许执行。
   *
   * 验证 JWT 访问令牌，如果验证成功则将用户信息附加到请求对象。
   *
   * @param {ExecutionContext} context - 执行上下文，提供当前请求的详细信息
   * @returns {Promise<boolean>} 如果允许访问则返回 `true`
   * @throws {UnauthorizedException} 当令牌缺失、格式错误或无效时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & {
        cookies?: Record<string, string>;
        user?: unknown;
      }
    >();

    // Try to get token from Cookie first (Fastify with @fastify/cookie plugin)
    let token: string | undefined;

    // Access cookies - Fastify cookie plugin adds cookies to request
    // Try multiple ways to access cookies for compatibility
    const requestAny = request as any;

    // Method 1: Direct cookies property
    if (request.cookies) {
      token = request.cookies[COOKIE_CONFIG.ACCESS_TOKEN.name];
    }

    // Method 2: Try unsignCookie if available (for signed cookies)
    if (!token && requestAny.unsignCookie) {
      const cookieValue = request.cookies?.[COOKIE_CONFIG.ACCESS_TOKEN.name];
      if (cookieValue) {
        const result = requestAny.unsignCookie(cookieValue);
        if (result.valid) {
          token = result.value;
        }
      }
    }

    // Method 3: Try accessing through raw request
    if (!token && request.raw?.headers?.cookie) {
      const cookieHeader = request.raw.headers.cookie as string;
      const cookies = this.parseCookies(cookieHeader);
      token = cookies[COOKIE_CONFIG.ACCESS_TOKEN.name];
    }

    // If not in cookie, try to get from Authorization header (Bearer token)
    if (!token) {
      const authHeader = request.headers.authorization;
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Access Token missing or malformed');
    }

    try {
      const payload: any = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });

      request.user = payload;

      // 如果 JWT payload 中包含 tenantId，将其设置到请求上下文中
      // 这样 TenantMiddleware 就可以使用它（如果 TenantMiddleware 在 AuthGuard 之后执行）
      // 或者如果 TenantMiddleware 在 AuthGuard 之前执行，这里可以验证一致性
      if (payload.tenantId) {
        const existingTenantId = (request as any)[TENANT_CONTEXT_KEY];
        if (existingTenantId && existingTenantId !== payload.tenantId) {
          throw new BadRequestException(
            'JWT token 中的租户 ID 与请求头中的租户 ID 不一致',
          );
        }
        (request as any)[TENANT_CONTEXT_KEY] = payload.tenantId;
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired Access Token');
    }
  }

  /**
   * 解析 Cookie 字符串
   *
   * 将 Cookie header 字符串解析为键值对对象。
   *
   * @private
   * @param {string} cookieHeader - Cookie header 字符串
   * @returns {Record<string, string>} Cookie 键值对对象
   */
  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name] = rest.join('=');
      }
    });

    return cookies;
  }
}
