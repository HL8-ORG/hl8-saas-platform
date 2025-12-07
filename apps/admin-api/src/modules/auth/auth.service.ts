import { Logger } from '@hl8/logger';
import { MailService, RegisterSuccessMail } from '@hl8/mail';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { FastifyRequest } from 'fastify';
import { TENANT_CONTEXT_KEY } from 'src/common/constants/tenant.constants';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { Tenant } from 'src/entities/tenant.entity';
import { User, UserRole } from 'src/entities/user.entity';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { LoginDto } from './dtos/login.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
import { SignupDto } from './dtos/signup.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';

/**
 * 认证服务类
 *
 * 负责处理用户认证相关的业务逻辑，包括注册、登录、令牌刷新和登出。
 *
 * **安全特性**：
 * - 密码使用 bcrypt 哈希（盐值 12 轮）
 * - 防止时序攻击（即使用户不存在也进行密码比较）
 * - 支持多设备登录（每个设备独立的刷新令牌）
 * - 自动清理过期令牌和多余的令牌
 * - 记录设备信息和 IP 地址用于安全审计
 *
 * **令牌管理**：
 * - 访问令牌：短期有效，用于 API 认证
 * - 刷新令牌：长期有效，存储在数据库中，支持令牌轮换
 * - 每个用户最多保留 5 个最新的刷新令牌
 *
 * @class AuthService
 * @description 用户认证业务逻辑处理服务
 */
@Injectable()
export class AuthService {
  /**
   * 构造函数
   *
   * 注入用户仓库、刷新令牌仓库、JWT 服务、配置服务、邮件服务、日志记录器和请求对象依赖。
   *
   * @param {Repository<User>} userRepository - 用户仓库
   * @param {Repository<RefreshToken>} refreshTokenRepository - 刷新令牌仓库
   * @param {JwtService} jwtService - JWT 服务，用于生成和验证令牌
   * @param {ConfigService} config - 配置服务，用于读取 JWT 配置
   * @param {MailService} mailService - 邮件服务，用于发送验证邮件
   * @param {Logger} logger - Pino 日志记录器
   * @param {FastifyRequest} request - 请求对象，用于获取租户上下文
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
    private logger: Logger,
    @Inject(REQUEST) private readonly request: FastifyRequest,
  ) {}

  /**
   * 获取当前租户 ID（同步方法）
   *
   * 从请求上下文中获取租户 ID，适用于已有租户上下文的情况。
   *
   * @private
   * @returns {string} 当前租户 ID
   * @throws {BadRequestException} 当租户 ID 不存在时抛出
   */
  private getCurrentTenantId(): string {
    const tenantId = (this.request as any)[TENANT_CONTEXT_KEY];
    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失');
    }
    return tenantId;
  }

  /**
   * 解析租户 ID（异步方法）
   *
   * 用于注册等公共接口，支持从多个来源获取租户 ID：
   * 1. 请求上下文（如果存在）
   * 2. X-Tenant-Id 请求头（如果提供）
   * 3. 默认租户（域名為 'default' 的租户，或第一个租户）
   *
   * @private
   * @param {FastifyRequest} req - 可选的请求对象（用于注册等公共接口）
   * @returns {Promise<string>} 租户 ID
   * @throws {BadRequestException} 当租户 ID 不存在且无法获取默认租户时抛出
   */
  private async resolveTenantId(req?: FastifyRequest): Promise<string> {
    // 优先从请求上下文获取
    let tenantId = (this.request as any)[TENANT_CONTEXT_KEY];

    // 如果请求上下文没有，尝试从传入的请求对象获取（用于注册等公共接口）
    if (!tenantId && req) {
      tenantId = (req as any)[TENANT_CONTEXT_KEY];

      // 如果还是没有，尝试从请求头获取
      if (!tenantId) {
        tenantId = req.headers['x-tenant-id'] as string | undefined;
      }
    }

    // 如果仍然没有租户 ID，尝试使用默认租户
    if (!tenantId) {
      const defaultTenantDomain = this.config.get<string>(
        'DEFAULT_TENANT_DOMAIN',
        'default',
      );
      const defaultTenant = await this.tenantRepository.findOne({
        where: { domain: defaultTenantDomain },
      });

      if (defaultTenant) {
        tenantId = defaultTenant.id;
      } else {
        // 如果默认租户也不存在，使用第一个租户
        const firstTenant = await this.tenantRepository.findOne({
          order: { createdAt: 'ASC' },
        });

        if (firstTenant) {
          tenantId = firstTenant.id;
        }
      }
    }

    if (!tenantId) {
      throw new BadRequestException('租户上下文缺失，且系统中没有可用租户');
    }

    return tenantId;
  }

  /**
   * 用户注册
   *
   * 创建新用户账户，密码会被哈希后存储。
   *
   * **业务规则**：
   * - 邮箱地址在租户内必须唯一，否则抛出 `ConflictException`
   * - 密码使用 bcrypt 哈希（盐值 12 轮）
   * - 新用户默认角色为 USER
   * - 新用户默认状态为激活（isActive = true）
   * - 自动设置租户 ID（从请求上下文、请求头或默认租户获取）
   *
   * **租户分配策略**：
   * 1. 优先使用请求上下文中的租户 ID（如果存在）
   * 2. 其次使用 X-Tenant-Id 请求头（如果提供）
   * 3. 最后使用默认租户（域名為 'default' 的租户，或第一个租户）
   *
   * @param {SignupDto} signupDto - 注册信息 DTO
   * @param {FastifyRequest} req - 可选的请求对象（用于获取租户 ID）
   * @returns {Promise<Object>} 注册结果，包含用户信息和成功消息
   * @throws {ConflictException} 当邮箱已被使用时抛出
   * @throws {BadRequestException} 当租户上下文缺失且无法获取默认租户时抛出
   */
  async signup(signupDto: SignupDto, req?: FastifyRequest) {
    const { email, password, fullName } = signupDto;
    const tenantId = await this.resolveTenantId(req);

    const existingUser = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.hashData(password);

    // 获取默认用户角色（从配置中读取，如果没有则使用实体默认值）
    const defaultRole = this.config.get<string>('DEFAULT_USER_ROLE', 'USER');
    const userRole = defaultRole as UserRole;

    const newUser = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      tenantId,
      role: userRole,
      isEmailVerified: false, // 新用户默认未验证邮箱
    });

    // 生成邮箱验证码（6位数字）
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    // 设置验证码过期时间（10分钟）
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 保存验证码到用户记录
    newUser.emailVerificationCode = verificationCode;
    newUser.emailVerificationExpiresAt = expiresAt;

    await this.userRepository.save(newUser);

    // 发送验证邮件
    try {
      const appName = this.config.get<string>('APP_NAME') || 'HL8 Platform';
      const appUrl =
        this.config.get<string>('APP_URL') || 'https://example.com';

      const emailHtml = RegisterSuccessMail({
        name: fullName,
        otp: verificationCode,
        appName,
        appUrl,
      });

      await this.mailService.sendEmail({
        to: [email],
        subject: `欢迎注册 ${appName} - 请验证您的邮箱`,
        html: emailHtml,
      });

      this.logger.log({
        message: 'Verification email sent',
        userId: newUser.id,
        email,
      });
    } catch (error) {
      // 邮件发送失败不影响注册流程，记录错误即可
      this.logger.error({
        message: 'Failed to send verification email',
        userId: newUser.id,
        email,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    this.logger.log({
      message: 'New user registered',
      userId: newUser.id,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      message: 'User registered successfully',
    };
  }

  /**
   * 用户登录
   *
   * 验证用户凭证并生成访问令牌和刷新令牌。
   *
   * **安全特性**：
   * - 防止时序攻击：即使用户不存在也进行密码比较
   * - 检查用户激活状态
   * - 记录设备信息和 IP 地址
   * - 自动清理过期令牌和多余的令牌
   * - 验证租户上下文
   *
   * **业务规则**：
   * - 用户必须存在且处于激活状态
   * - 密码必须匹配
   * - 用户必须属于当前租户
   * - 每次登录创建新的刷新令牌（支持多设备）
   * - 每个用户最多保留 5 个最新的刷新令牌
   *
   * @param {LoginDto} loginDto - 登录信息 DTO
   * @param {string} [deviceInfo] - 设备信息（User-Agent）
   * @param {string} [ipAddress] - IP 地址
   * @returns {Promise<Object>} 用户信息和令牌
   * @throws {UnauthorizedException} 当邮箱或密码无效时抛出
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async login(loginDto: LoginDto, deviceInfo?: string, ipAddress?: string) {
    const { email, password } = loginDto;
    const tenantId = this.getCurrentTenantId();

    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    const passwordHash =
      user?.passwordHash ||
      (await this.hashData('dummy-password-to-prevent-timing-attack'));
    const passwordMatches = await bcrypt.compare(password, passwordHash);

    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    const hashedRt = await this.hashData(tokens.refreshToken);

    const refreshExpiry =
      this.config.get<string>('JWT_REFRESH_EXPIRY') || '30d';
    const expiryMs = this.parseExpiryToMilliseconds(refreshExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);

    const refreshToken = this.refreshTokenRepository.create({
      token: hashedRt,
      userId: user.id,
      tenantId: user.tenantId,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP',
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    await this.cleanupExpiredTokens(user.id);

    this.logger.log({
      message: 'User logged in',
      userId: user.id,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * 刷新访问令牌
   *
   * 使用刷新令牌生成新的访问令牌和刷新令牌（令牌轮换）。
   *
   * **安全特性**：
   * - 验证刷新令牌的有效性（通过 bcrypt 比较）
   * - 检查用户激活状态
   * - 验证租户上下文
   * - 更新设备信息和 IP 地址
   * - 支持令牌轮换（每次刷新生成新令牌）
   *
   * **业务规则**：
   * - 用户必须存在且处于激活状态
   * - 用户必须属于当前租户
   * - 刷新令牌必须有效且未过期
   * - 更新现有刷新令牌记录（不创建新记录）
   *
   * @param {string} userId - 用户 ID
   * @param {string} rt - 刷新令牌
   * @param {string} [deviceInfo] - 设备信息（User-Agent）
   * @param {string} [ipAddress] - IP 地址
   * @returns {Promise<Object>} 新的访问令牌和刷新令牌
   * @throws {ForbiddenException} 当用户不存在或未激活时抛出
   * @throws {UnauthorizedException} 当刷新令牌无效时抛出
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async refreshToken(
    userId: string,
    rt: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const tenantId = this.getCurrentTenantId();
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const storedTokens = await this.refreshTokenRepository.find({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
        expiresAt: MoreThanOrEqual(new Date()),
      },
    });

    let isValidToken = false;
    let validTokenId: string | null = null;

    for (const storedToken of storedTokens) {
      const matches = await bcrypt.compare(rt, storedToken.token);
      if (matches) {
        isValidToken = true;
        validTokenId = storedToken.id;
        break;
      }
    }

    if (!isValidToken || !validTokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    const hashedRt = await this.hashData(tokens.refreshToken);

    const refreshExpiry =
      this.config.get<string>('JWT_REFRESH_EXPIRY') || '30d';
    const expiryMs = this.parseExpiryToMilliseconds(refreshExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);

    await this.refreshTokenRepository.update(validTokenId, {
      token: hashedRt,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP',
      expiresAt,
    });

    return tokens;
  }

  /**
   * 用户登出
   *
   * 删除用户的刷新令牌。
   *
   * **业务规则**：
   * - 如果提供了刷新令牌，只删除该令牌（单设备登出）
   * - 如果未提供刷新令牌，删除用户的所有刷新令牌（全设备登出）
   *
   * @param {string} userId - 用户 ID
   * @param {string} [rt] - 可选的刷新令牌（用于单设备登出）
   * @returns {Promise<Object>} 登出成功消息
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async logout(userId: string, rt?: string) {
    const tenantId = this.getCurrentTenantId();

    if (rt) {
      const storedTokens = await this.refreshTokenRepository.find({
        where: { userId, tenantId },
      });

      for (const storedToken of storedTokens) {
        const matches = await bcrypt.compare(rt, storedToken.token);
        if (matches) {
          await this.refreshTokenRepository.delete(storedToken.id);
          break;
        }
      }
    } else {
      await this.refreshTokenRepository.delete({ userId, tenantId });
    }

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * 获取当前用户信息
   *
   * 根据用户 ID 查询并返回用户信息。
   *
   * @param {string} userId - 用户 ID
   * @returns {Promise<Object>} 用户信息
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async getMe(userId: string) {
    const tenantId = this.getCurrentTenantId();
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }

  // Helper Methods

  /**
   * 哈希数据
   *
   * 使用 bcrypt 对数据进行哈希，盐值 12 轮。
   *
   * @param {string} data - 要哈希的数据
   * @returns {Promise<string>} 哈希后的数据
   */
  async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(data, salt);
  }

  /**
   * 生成 JWT 令牌
   *
   * 为用户生成访问令牌和刷新令牌。
   *
   * **令牌载荷**：
   * - sub: 用户 ID
   * - role: 用户角色
   * - email: 用户邮箱
   * - tenantId: 租户 ID（用于多租户支持）
   *
   * **令牌配置**：
   * - 访问令牌：默认 15 分钟（可通过 JWT_ACCESS_EXPIRY 配置）
   * - 刷新令牌：默认 7 天（可通过 JWT_REFRESH_EXPIRY 配置）
   *
   * @param {User} user - 用户实体对象
   * @returns {Promise<Object>} 包含访问令牌和刷新令牌的对象
   */
  async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      tenantId: user.tenantId,
    };
    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRY') || '15m';
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      // @ts-expect-error - JWT library type definition issue with expiresIn accepting string
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiry,
      }),
      // @ts-expect-error - JWT library type definition issue with expiresIn accepting string
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiry,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * 清理过期和多余的令牌
   *
   * 删除用户的过期令牌，并保留最多 5 个最新的刷新令牌。
   *
   * **清理策略**：
   * 1. 删除所有过期的刷新令牌
   * 2. 如果令牌数量超过 5 个，删除最旧的令牌（保留最新的 5 个）
   *
   * @private
   * @param {string} userId - 用户 ID
   * @returns {Promise<void>} 清理操作完成的 Promise
   */
  private async cleanupExpiredTokens(userId: string) {
    const tenantId = this.getCurrentTenantId();
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId AND tenantId = :tenantId AND expiresAt < :now', {
        userId,
        tenantId,
        now: new Date(),
      })
      .execute();

    const tokens = await this.refreshTokenRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      skip: 5,
      take: 100,
    });

    if (tokens.length > 0) {
      await this.refreshTokenRepository.delete({
        id: In(tokens.map((t) => t.id)),
      });
    }
  }

  /**
   * 验证邮箱
   *
   * 使用验证码验证用户邮箱，验证成功后更新用户状态并清除验证码。
   *
   * **验证规则**：
   * - 验证码必须匹配
   * - 验证码必须在有效期内（10分钟）
   * - 用户必须存在且邮箱未验证
   * - 用户必须属于当前租户
   *
   * @param {VerifyEmailDto} verifyEmailDto - 邮箱验证 DTO（包含邮箱和验证码）
   * @returns {Promise<Object>} 验证成功消息和用户信息
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {UnauthorizedException} 当验证码无效或已过期时抛出
   * @throws {ConflictException} 当邮箱已验证时抛出
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;
    const tenantId = this.getCurrentTenantId();

    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('邮箱已验证');
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
      throw new UnauthorizedException('验证码无效或已过期');
    }

    if (user.emailVerificationCode !== code) {
      throw new UnauthorizedException('验证码错误');
    }

    const now = new Date();
    if (user.emailVerificationExpiresAt < now) {
      throw new UnauthorizedException('验证码已过期，请重新发送');
    }

    // 验证成功，更新用户状态并清除验证码
    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiresAt = null;
    await this.userRepository.save(user);

    this.logger.log({
      message: 'Email verified successfully',
      userId: user.id,
      email,
    });

    return {
      message: '邮箱验证成功',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  /**
   * 重新发送验证邮件
   *
   * 为未验证的用户重新生成验证码并发送验证邮件。
   *
   * **限制**：
   * - 用户必须存在
   * - 用户邮箱必须未验证
   * - 用户必须属于当前租户
   * - 限流：每分钟最多 3 次请求（由控制器控制）
   *
   * @param {ResendVerificationDto} resendVerificationDto - 重新发送验证邮件 DTO（包含邮箱）
   * @returns {Promise<Object>} 发送成功消息
   * @throws {NotFoundException} 当用户不存在时抛出
   * @throws {ConflictException} 当邮箱已验证时抛出
   * @throws {BadRequestException} 当租户上下文缺失时抛出
   */
  async resendVerificationEmail(resendVerificationDto: ResendVerificationDto) {
    const { email } = resendVerificationDto;
    const tenantId = this.getCurrentTenantId();

    const user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.isEmailVerified) {
      throw new ConflictException('邮箱已验证，无需重新发送');
    }

    // 生成新的验证码
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // 更新验证码
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiresAt = expiresAt;
    await this.userRepository.save(user);

    // 发送验证邮件
    try {
      const appName = this.config.get<string>('APP_NAME') || 'HL8 Platform';
      const appUrl =
        this.config.get<string>('APP_URL') || 'https://example.com';

      const emailHtml = RegisterSuccessMail({
        name: user.fullName,
        otp: verificationCode,
        appName,
        appUrl,
      });

      await this.mailService.sendEmail({
        to: [email],
        subject: `欢迎注册 ${appName} - 请验证您的邮箱`,
        html: emailHtml,
      });

      this.logger.log({
        message: 'Verification email resent',
        userId: user.id,
        email,
      });

      return {
        message: '验证邮件已重新发送，请查收邮箱',
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to resend verification email',
        userId: user.id,
        email,
        error: error instanceof Error ? error.message : String(error),
      });

      throw new UnauthorizedException('邮件发送失败，请稍后重试');
    }
  }

  /**
   * 解析过期时间字符串为毫秒数
   *
   * 将格式如 "30d"、"7d"、"15m" 的字符串转换为毫秒数。
   *
   * **支持的单位**：
   * - s: 秒
   * - m: 分钟
   * - h: 小时
   * - d: 天
   *
   * @private
   * @param {string} expiry - 过期时间字符串（格式：数字+单位，如 "30d"）
   * @returns {number} 毫秒数，如果格式无效则返回默认值（30 天）
   */
  private parseExpiryToMilliseconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const units: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * units[unit];
  }
}
