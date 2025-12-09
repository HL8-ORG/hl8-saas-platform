import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import type { IJwtService } from '../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { RefreshTokenInputDto } from '../dtos/refresh-token.input.dto';
import { RefreshTokenOutputDto } from '../dtos/refresh-token.output.dto';

/**
 * 刷新令牌用例
 *
 * 处理刷新访问令牌业务逻辑，包括验证刷新令牌、生成新令牌、更新刷新令牌记录等。
 *
 * @class RefreshTokenUseCase
 * @implements {IUseCase<RefreshTokenInputDto, RefreshTokenOutputDto>}
 * @description 刷新令牌用例
 */
@Injectable()
export class RefreshTokenUseCase implements IUseCase<
  RefreshTokenInputDto,
  RefreshTokenOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserRepository} userRepository - 用户仓储
   * @param {IPasswordHasher} passwordHasher - 密码哈希服务（用于验证刷新令牌）
   * @param {IJwtService} jwtService - JWT服务
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {IRefreshTokenRepository} refreshTokenRepository - 刷新令牌仓储
   * @param {ConfigService} config - 配置服务
   */
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    @Inject('IJwtService')
    private readonly jwtService: IJwtService,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly config: ConfigService,
  ) {}

  /**
   * 执行刷新令牌用例
   *
   * @param {RefreshTokenInputDto} input - 刷新令牌输入参数
   * @returns {Promise<RefreshTokenOutputDto>} 新的令牌
   * @throws {ForbiddenException} 当用户不存在或未激活时抛出
   * @throws {UnauthorizedException} 当刷新令牌无效时抛出
   */
  async execute(input: RefreshTokenInputDto): Promise<RefreshTokenOutputDto> {
    const {
      userId: userIdStr,
      refreshToken: rt,
      deviceInfo,
      ipAddress,
    } = input;

    // 获取当前租户ID
    const tenantIdStr = this.tenantResolver.getCurrentTenantId();
    const tenantId = new TenantId(tenantIdStr);

    // 创建用户ID值对象
    const userId = new UserId(userIdStr);

    // 查找用户
    const user = await this.userRepository.findById(userId, tenantId);

    if (!user || !user.isActive) {
      throw new ForbiddenException('Invalid refresh token');
    }

    // 查找并验证刷新令牌
    const tokenId = await this.refreshTokenRepository.findAndVerifyToken(
      userId.toString(),
      tenantIdStr,
      rt,
    );

    if (!tokenId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 生成新的JWT令牌
    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id.toString(),
      role: user.role,
      email: user.email.value,
      tenantId: user.tenantId.toString(),
    });

    const newRefreshToken = await this.jwtService.signRefreshToken({
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

    // 哈希新的刷新令牌并更新记录
    const hashedRefreshToken = await this.passwordHasher.hash(newRefreshToken);
    await this.refreshTokenRepository.update(tokenId, {
      token: hashedRefreshToken,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || 'Unknown IP',
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
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
