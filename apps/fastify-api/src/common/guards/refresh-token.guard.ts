import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { COOKIE_CONFIG } from '../constants/cookie.config';

/**
 * 刷新令牌守卫
 *
 * 实现了 `CanActivate` 接口，用于验证 JWT 刷新令牌。
 * 从 Cookie 中提取刷新令牌，验证后将其载荷附加到请求对象上。
 *
 * **使用场景**：
 * - 刷新访问令牌的端点
 * - 登出端点（需要验证刷新令牌）
 *
 * **工作流程**：
 * 1. 从 Cookie 中提取刷新令牌
 * 2. 验证令牌的有效性和签名
 * 3. 将令牌载荷附加到请求对象，供后续使用
 *
 * @class RefreshTokenGuard
 * @implements {CanActivate}
 * @description JWT 刷新令牌认证守卫
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  /**
   * 构造函数
   *
   * 注入 JWT 服务和配置服务依赖。
   *
   * @param {JwtService} jwtService - JWT 服务，用于验证令牌
   * @param {ConfigService} config - 配置服务，用于读取 JWT 刷新密钥
   */
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   * 确定当前请求是否允许执行。
   *
   * 验证 JWT 刷新令牌，如果验证成功则将用户信息附加到请求对象。
   *
   * @param {ExecutionContext} context - 执行上下文，提供当前请求的详细信息
   * @returns {Promise<boolean>} 如果允许访问则返回 `true`
   * @throws {UnauthorizedException} 当令牌缺失、格式错误或无效时抛出
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      cookies: Record<string, string>;
      user?: unknown;
    }>();
    const token = request.cookies[COOKIE_CONFIG.REFRESH_TOKEN.name];

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Refresh Token missing or malformed');
    }

    try {
      const payload: unknown = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Refresh Token');
    }
  }
}
