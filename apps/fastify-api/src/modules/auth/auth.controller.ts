import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { COOKIE_CONFIG } from 'src/common/constants/cookie.config';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { PublicTenant } from 'src/common/decorators/tenant.decorator';
import { RefreshTokenGuard } from 'src/common/guards/refresh-token.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { SignupDto } from './dtos/signup.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

/**
 * Cookie 序列化选项类型
 *
 * @description
 * 与 @fastify/cookie 插件兼容的 Cookie 选项类型。
 * 支持所有标准的 Cookie 属性，包括 secure 的 "auto" 选项。
 */
type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: boolean | 'strict' | 'lax' | 'none';
  secure?: boolean | 'auto';
  maxAge?: number;
  path?: string;
  domain?: string;
  expires?: Date;
  encode?: (value: string) => string;
};

/**
 * 扩展 FastifyRequest 类型以包含 cookies 属性
 *
 * @description
 * 此类型扩展用于支持 @fastify/cookie 插件提供的 cookies 功能。
 * 需要安装 @fastify/cookie 插件并在应用中注册才能正常工作。
 */
interface FastifyRequestWithCookies extends FastifyRequest {
  cookies: Record<string, string>;
}

/**
 * 扩展 FastifyReply 类型以包含 cookie 方法
 *
 * @description
 * 此类型扩展用于支持 @fastify/cookie 插件提供的 cookie 操作方法。
 * 使用兼容的 CookieOptions 类型以确保与 @fastify/cookie 插件类型兼容。
 */
interface FastifyReplyWithCookies extends FastifyReply {
  setCookie(name: string, value: string, options?: CookieOptions): this;
  clearCookie(name: string, options?: CookieOptions): this;
}

/**
 * 认证控制器
 *
 * 处理用户认证相关的 REST API 请求。
 * 包含注册、登录、刷新令牌、登出和获取当前用户信息的端点。
 *
 * **安全特性**：
 * - 使用限流保护敏感端点（注册、登录）
 * - 令牌存储在 HttpOnly Cookie 中，防止 XSS 攻击
 * - 支持多设备登录（每个设备独立的刷新令牌）
 * - 记录设备信息和 IP 地址用于安全审计
 *
 * @class AuthController
 * @description 用户认证的 REST API 控制器
 */
@Controller('auth')
export class AuthController {
  /**
   * 构造函数
   *
   * 注入认证服务依赖。
   *
   * @param {AuthService} authService - 认证服务，处理认证业务逻辑
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   *
   * 创建新用户账户。
   *
   * **限流策略**：
   * - 使用 strict 限流：每分钟最多 3 次请求
   *
   * @param {SignupDto} signupDto - 注册信息 DTO
   * @returns {Promise<any>} 注册结果，包含用户信息
   */
  @Throttle({ strict: { ttl: 60000, limit: 3 } })
  @Public()
  @PublicTenant()
  @Post('/signup')
  async signup(@Body() signupDto: SignupDto, @Req() req: FastifyRequest) {
    return this.authService.signup(signupDto, req);
  }

  /**
   * 用户登录
   *
   * 验证用户凭证并生成访问令牌和刷新令牌。
   * 令牌存储在 HttpOnly Cookie 中。
   *
   * **限流策略**：
   * - 使用 strict 限流：每分钟最多 5 次请求
   *
   * **安全特性**：
   * - 记录设备信息和 IP 地址
   * - 防止时序攻击（即使用户不存在也进行密码比较）
   *
   * @param {LoginDto} loginDto - 登录信息 DTO
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @returns {Promise<Object>} 用户信息（令牌已存储在 Cookie 中）
   */
  @Throttle({ strict: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) reply: FastifyReplyWithCookies,
  ) {
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      'Unknown IP';

    const data = await this.authService.login(loginDto, deviceInfo, ipAddress);

    reply.setCookie(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      data.accessToken,
      COOKIE_CONFIG.ACCESS_TOKEN.options,
    );
    reply.setCookie(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      data.refreshToken,
      COOKIE_CONFIG.REFRESH_TOKEN.options,
    );

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /**
   * 刷新访问令牌
   *
   * 使用刷新令牌生成新的访问令牌和刷新令牌。
   *
   * **限流策略**：
   * - 使用 default 限流：每分钟最多 10 次请求
   *
   * **安全特性**：
   * - 验证刷新令牌的有效性
   * - 更新设备信息和 IP 地址
   * - 支持令牌轮换（每次刷新生成新令牌）
   *
   * @param {string} userId - 用户 ID（从 JWT 载荷中提取）
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @returns {Promise<Object>} 刷新成功消息（新令牌已存储在 Cookie 中）
   */
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/refresh')
  async refreshToken(
    @GetUser('sub') userId: string,
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) reply: FastifyReplyWithCookies,
  ) {
    const rt = req.cookies[COOKIE_CONFIG.REFRESH_TOKEN.name] as string;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      'Unknown IP';

    const { accessToken, refreshToken } = await this.authService.refreshToken(
      userId,
      rt,
      deviceInfo,
      ipAddress,
    );

    reply.setCookie(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      accessToken,
      COOKIE_CONFIG.ACCESS_TOKEN.options,
    );
    reply.setCookie(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      refreshToken,
      COOKIE_CONFIG.REFRESH_TOKEN.options,
    );

    return {
      message: 'Tokens refreshed successfully',
    };
  }

  /**
   * 用户登出
   *
   * 删除用户的刷新令牌并清除 Cookie。
   *
   * **安全特性**：
   * - 如果提供了刷新令牌，只删除该令牌
   * - 如果未提供刷新令牌，删除用户的所有刷新令牌（全设备登出）
   * - 清除访问令牌和刷新令牌的 Cookie
   *
   * @param {string} userId - 用户 ID（从 JWT 载荷中提取）
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} reply - Fastify 响应对象
   * @returns {Promise<Object>} 登出成功消息
   */
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('/logout')
  async logout(
    @GetUser('sub') userId: string,
    @Req() req: FastifyRequestWithCookies,
    @Res({ passthrough: true }) reply: FastifyReplyWithCookies,
  ) {
    const rt = req.cookies[COOKIE_CONFIG.REFRESH_TOKEN.name] as
      | string
      | undefined;
    await this.authService.logout(userId, rt);

    reply.clearCookie(
      COOKIE_CONFIG.ACCESS_TOKEN.name,
      COOKIE_CONFIG.ACCESS_TOKEN.options,
    );
    reply.clearCookie(
      COOKIE_CONFIG.REFRESH_TOKEN.name,
      COOKIE_CONFIG.REFRESH_TOKEN.options,
    );

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * 获取当前用户信息
   *
   * 返回当前登录用户的详细信息。
   *
   * **限流策略**：
   * - 跳过限流（使用 @SkipThrottle()）
   *
   * @param {string} userId - 用户 ID（从 JWT 载荷中提取）
   * @returns {Promise<any>} 用户信息
   */
  @SkipThrottle()
  @Get('/me')
  async getMe(@GetUser('sub') userId: string) {
    return this.authService.getMe(userId);
  }

  /**
   * 验证邮箱
   *
   * 使用验证码验证用户邮箱，验证成功后更新用户状态。
   *
   * **限流策略**：
   * - 使用 strict 限流：每分钟最多 5 次请求
   *
   * @param {VerifyEmailDto} verifyEmailDto - 邮箱验证 DTO（包含邮箱和验证码）
   * @returns {Promise<Object>} 验证成功消息和用户信息
   */
  @Throttle({ strict: { ttl: 60000, limit: 5 } })
  @Public()
  @Post('/verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  /**
   * 重新发送验证邮件
   *
   * 为未验证的用户重新生成验证码并发送验证邮件。
   *
   * **限流策略**：
   * - 使用 strict 限流：每分钟最多 3 次请求
   *
   * @param {ResendVerificationDto} resendVerificationDto - 重新发送验证邮件 DTO（包含邮箱）
   * @returns {Promise<Object>} 发送成功消息
   */
  @Throttle({ strict: { ttl: 60000, limit: 3 } })
  @Public()
  @Post('/resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerificationEmail(resendVerificationDto);
  }
}
