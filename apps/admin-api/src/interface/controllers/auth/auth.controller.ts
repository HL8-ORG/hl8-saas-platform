import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LoginCommand } from '../../../application/auth/commands/login.command';
import { LogoutCommand } from '../../../application/auth/commands/logout.command';
import { RefreshTokenCommand } from '../../../application/auth/commands/refresh-token.command';
import { ResendVerificationCommand } from '../../../application/auth/commands/resend-verification.command';
import { VerifyEmailCommand } from '../../../application/auth/commands/verify-email.command';
import { GetMeQuery } from '../../../application/auth/queries/get-me.query';
import { COOKIE_CONFIG } from '../../../common/constants/cookie.config';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PublicTenant } from '../../../common/decorators/tenant.decorator';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';
import { LoginDto } from '../../dtos/auth/login.dto';
import { SignupDto } from '../../dtos/auth/signup.dto';
import { VerifyEmailDto } from '../../dtos/auth/verify-email.dto';
import { AuthMapper } from '../../mappers/auth.mapper';

/**
 * Cookie 序列化选项类型
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
 * 认证控制器
 *
 * 处理用户认证相关的请求，包括注册、登录、刷新令牌、登出等。
 * 使用 CQRS 架构，通过 CommandBus 和 QueryBus 处理请求。
 *
 * **安全特性**：
 * - 登录/注册/刷新令牌/重发验证码接口受限流保护
 * - 使用 HttpOnly Cookie 存储刷新令牌
 *
 * @class AuthController
 * @description 认证模块的 REST API 控制器（CQRS）
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * 用户注册
   *
   * 注册新用户。此接口为公共接口，不需要认证。
   *
   * @param {SignupDto} signupDto - 注册数据 DTO
   * @returns {Promise<any>} 注册成功的用户信息
   */
  @Public()
  @PublicTenant()
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const command = AuthMapper.toSignupCommand(signupDto);
    return this.commandBus.execute(command);
  }

  /**
   * 用户登录
   *
   * 用户登录并获取访问令牌和刷新令牌。
   * 刷新令牌存储在 HttpOnly Cookie 中。
   *
   * **安全**：严厉的限流策略（每分钟 5 次）
   *
   * @param {LoginDto} loginDto - 登录数据 DTO
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} res - Fastify 响应对象
   * @returns {Promise<void>} 返回访问令牌和用户信息
   */
  @Public()
  @PublicTenant()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const command = new LoginCommand(
      loginDto.email,
      loginDto.password,
      ipAddress,
      userAgent,
    );

    const result = await this.commandBus.execute(command);

    // 设置刷新令牌 Cookie
    const cookieOptions: CookieOptions = {
      ...COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    res.setCookie('refresh_token', result.refreshToken, cookieOptions);

    return res.send({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  /**
   * 刷新访问令牌
   *
   * 使用刷新令牌获取新的访问令牌。
   * 需要携带有效的刷新令牌（通常在 Cookie 中）。
   *
   * **安全**：严厉的限流策略（每分钟 5 次）
   *
   * @param {string} userId - 用户 ID（从刷新令牌中提取）
   * @param {string} refreshToken - 刷新令牌（从 Cookie 中提取）
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} res - Fastify 响应对象
   * @returns {Promise<void>} 返回新的访问令牌
   */
  @Public()
  @PublicTenant()
  @UseGuards(RefreshTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh-token')
  async refreshToken(
    @GetUser('sub') userId: string,
    @GetUser('refreshToken') refreshToken: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const command = new RefreshTokenCommand(
      userId,
      refreshToken,
      ipAddress,
      userAgent,
    );

    const result = await this.commandBus.execute(command);

    // 更新刷新令牌 Cookie
    const cookieOptions: CookieOptions = {
      ...COOKIE_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    res.setCookie('refresh_token', result.refreshToken, cookieOptions);

    return res.send({
      accessToken: result.accessToken,
    });
  }

  /**
   * 用户登出
   *
   * 登出当前用户，清除刷新令牌 Cookie。
   *
   * @param {string} userId - 用户 ID
   * @param {FastifyRequest} req - Fastify 请求对象
   * @param {FastifyReply} res - Fastify 响应对象
   * @returns {Promise<void>} 登出成功消息
   */
  @Post('logout')
  @SkipThrottle()
  async logout(
    @GetUser('sub') userId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const refreshToken = req.cookies['refresh_token'];

    const command = new LogoutCommand(userId, refreshToken);
    const result = await this.commandBus.execute(command);

    // 清除 Cookie
    res.clearCookie('refresh_token', { path: '/' });

    return res.send(result);
  }

  /**
   * 获取当前用户信息
   *
   * 获取当前登录用户的详细信息。
   *
   * @param {string} userId - 用户 ID
   * @returns {Promise<any>} 用户信息
   */
  @Get('me')
  @SkipThrottle()
  async getMe(@GetUser('sub') userId: string) {
    return this.queryBus.execute(new GetMeQuery(userId));
  }

  /**
   * 验证邮箱
   *
   * 验证用户的邮箱地址。
   *
   * @param {string} userId - 用户 ID
   * @param {VerifyEmailDto} verifyEmailDto - 验证信息 DTO
   * @returns {Promise<any>} 验证结果
   */
  @Post('verify-email')
  @SkipThrottle()
  async verifyEmail(
    @GetUser('sub') userId: string,
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    const command = new VerifyEmailCommand(userId, verifyEmailDto.code);
    return this.commandBus.execute(command);
  }

  /**
   * 重发验证邮件
   *
   * 重新发送邮箱验证码。
   *
   * **安全**：受限流保护（每分钟 1 次）
   *
   * @param {string} userId - 用户 ID
   * @returns {Promise<any>} 发送结果
   */
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Post('resend-verification')
  async resendVerification(@GetUser('sub') userId: string) {
    return this.commandBus.execute(new ResendVerificationCommand(userId));
  }
}
