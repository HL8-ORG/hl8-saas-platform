import { Logger } from '@hl8/logger';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { LoginDto } from './dtos/login.dto';
import { SignupDto } from './dtos/signup.dto';

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
   * 注入用户仓库、刷新令牌仓库、JWT 服务、配置服务和日志记录器依赖。
   *
   * @param {Repository<User>} userRepository - 用户仓库
   * @param {Repository<RefreshToken>} refreshTokenRepository - 刷新令牌仓库
   * @param {JwtService} jwtService - JWT 服务，用于生成和验证令牌
   * @param {ConfigService} config - 配置服务，用于读取 JWT 配置
   * @param {Logger} logger - Pino 日志记录器
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
    private logger: Logger,
  ) {}

  /**
   * 用户注册
   *
   * 创建新用户账户，密码会被哈希后存储。
   *
   * **业务规则**：
   * - 邮箱地址必须唯一，否则抛出 `ConflictException`
   * - 密码使用 bcrypt 哈希（盐值 12 轮）
   * - 新用户默认角色为 USER
   * - 新用户默认状态为激活（isActive = true）
   *
   * @param {SignupDto} signupDto - 注册信息 DTO
   * @returns {Promise<Object>} 注册结果，包含用户信息和成功消息
   * @throws {ConflictException} 当邮箱已被使用时抛出
   */
  async signup(signupDto: SignupDto) {
    const { email, password, fullName } = signupDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.hashData(password);

    const newUser = this.userRepository.create({
      email,
      passwordHash: hashedPassword,
      fullName,
    });

    await this.userRepository.save(newUser);

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
   *
   * **业务规则**：
   * - 用户必须存在且处于激活状态
   * - 密码必须匹配
   * - 每次登录创建新的刷新令牌（支持多设备）
   * - 每个用户最多保留 5 个最新的刷新令牌
   *
   * @param {LoginDto} loginDto - 登录信息 DTO
   * @param {string} [deviceInfo] - 设备信息（User-Agent）
   * @param {string} [ipAddress] - IP 地址
   * @returns {Promise<Object>} 用户信息和令牌
   * @throws {UnauthorizedException} 当邮箱或密码无效时抛出
   */
  async login(loginDto: LoginDto, deviceInfo?: string, ipAddress?: string) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
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
   * - 更新设备信息和 IP 地址
   * - 支持令牌轮换（每次刷新生成新令牌）
   *
   * **业务规则**：
   * - 用户必须存在且处于激活状态
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
   */
  async refreshToken(
    userId: string,
    rt: string,
    deviceInfo?: string,
    ipAddress?: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new ForbiddenException('Invalid refresh token');
    }

    const storedTokens = await this.refreshTokenRepository.find({
      where: {
        userId: user.id,
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
   */
  async logout(userId: string, rt?: string) {
    if (rt) {
      const storedTokens = await this.refreshTokenRepository.find({
        where: { userId },
      });

      for (const storedToken of storedTokens) {
        const matches = await bcrypt.compare(rt, storedToken.token);
        if (matches) {
          await this.refreshTokenRepository.delete(storedToken.id);
          break;
        }
      }
    } else {
      await this.refreshTokenRepository.delete({ userId });
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
   */
  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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
    const payload = { sub: user.id, role: user.role, email: user.email };
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
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId AND expiresAt < :now', {
        userId,
        now: new Date(),
      })
      .execute();

    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
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
