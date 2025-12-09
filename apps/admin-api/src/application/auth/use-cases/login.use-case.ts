import { Logger } from '@hl8/logger';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IJwtService } from '../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { LoginInputDto } from '../dtos/login.input.dto';
import { LoginOutputDto } from '../dtos/login.output.dto';

/**
 * 用户登录用例
 *
 * 处理用户登录业务逻辑，包括验证凭证、生成令牌、创建刷新令牌等。
 *
 * @class LoginUseCase
 * @implements {IUseCase<LoginInputDto, LoginOutputDto>}
 * @description 用户登录用例
 */
@Injectable()
export class LoginUseCase implements IUseCase<LoginInputDto, LoginOutputDto> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserRepository} userRepository - 用户仓储
   * @param {IPasswordHasher} passwordHasher - 密码哈希服务
   * @param {IJwtService} jwtService - JWT服务
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {IRefreshTokenRepository} refreshTokenRepository - 刷新令牌仓储
   * @param {ConfigService} config - 配置服务
   * @param {Logger} logger - 日志服务
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly jwtService: IJwtService,
    private readonly tenantResolver: ITenantResolver,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * 执行用户登录用例
   *
   * @param {LoginInputDto} input - 登录输入参数
   * @returns {Promise<LoginOutputDto>} 登录结果
   * @throws {UnauthorizedException} 当邮箱或密码无效时抛出
   */
  async execute(input: LoginInputDto): Promise<LoginOutputDto> {
    const { email: emailStr, password, deviceInfo, ipAddress } = input;

    // 获取当前租户ID
    const tenantIdStr = this.tenantResolver.getCurrentTenantId();
    const tenantId = new TenantId(tenantIdStr);

    // 创建邮箱值对象
    const email = new Email(emailStr);

    // 查找用户
    const user = await this.userRepository.findByEmail(email, tenantId);

    // 防止时序攻击：即使用户不存在也进行密码比较
    const passwordHash = user
      ? user.passwordHash.value
      : await this.passwordHasher.hash(
          'dummy-password-to-prevent-timing-attack',
        );

    const passwordMatches = await this.passwordHasher.verify(
      password,
      passwordHash,
    );

    // 验证用户和密码
    if (!user || !user.isActive || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 生成JWT令牌
    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id.toString(),
      role: user.role,
      email: user.email.value,
      tenantId: user.tenantId.toString(),
    });

    const refreshToken = await this.jwtService.signRefreshToken({
      sub: user.id.toString(),
      role: user.role,
      email: user.email.value,
      tenantId: user.tenantId.toString(),
    });

    // 计算刷新令牌过期时间
    const refreshExpiry =
      this.config.get<string>('JWT_REFRESH_EXPIRY') || '30d';
    const expiryMs = this.parseExpiryToMilliseconds(refreshExpiry);
    const expiresAt = new Date(Date.now() + expiryMs);

    // 哈希刷新令牌并保存
    const hashedRefreshToken = await this.passwordHasher.hash(refreshToken);
    await this.refreshTokenRepository.create({
      token: hashedRefreshToken,
      userId: user.id.toString(),
      tenantId: user.tenantId.toString(),
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP',
      expiresAt,
    });

    // 清理过期和多余的令牌
    await this.refreshTokenRepository.cleanupExpired(
      user.id.toString(),
      user.tenantId.toString(),
    );

    this.logger.log({
      message: 'User logged in',
      userId: user.id.toString(),
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email.value,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 解析过期时间字符串为毫秒数
   *
   * @private
   * @param {string} expiry - 过期时间字符串（如 '30d', '7d', '15m'）
   * @returns {number} 毫秒数
   */
  private parseExpiryToMilliseconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000; // 默认30天
    }
  }
}
