import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { IJwtService } from '../../application/shared/interfaces/jwt-service.interface';

/**
 * JWT服务实现
 *
 * 基于 @nestjs/jwt 的JWT服务实现。
 * 负责生成访问令牌和刷新令牌。
 *
 * @class AuthJwtService
 * @implements {IJwtService}
 * @description JWT服务实现（避免与 @nestjs/jwt 的 JwtService 名称冲突）
 */
@Injectable()
export class AuthJwtService implements IJwtService {
  /**
   * 构造函数
   *
   * 注入 NestJS JWT 服务和配置服务。
   *
   * @param {NestJwtService} jwtService - NestJS JWT 服务
   * @param {ConfigService} config - 配置服务
   */
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 生成访问令牌
   *
   * 根据载荷生成JWT访问令牌。
   *
   * @param {object} payload - JWT载荷
   * @returns {Promise<string>} 访问令牌
   */
  async signAccessToken(payload: {
    sub: string;
    role: string;
    email: string;
    tenantId?: string;
  }): Promise<string> {
    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRY') || '15m';

    // @ts-expect-error - JWT library type definition issue with expiresIn accepting string
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessExpiry,
    });
  }

  /**
   * 生成刷新令牌
   *
   * 根据载荷生成JWT刷新令牌。
   *
   * @param {object} payload - JWT载荷
   * @returns {Promise<string>} 刷新令牌
   */
  async signRefreshToken(payload: {
    sub: string;
    role: string;
    email: string;
    tenantId?: string;
  }): Promise<string> {
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY') || '7d';

    // @ts-expect-error - JWT library type definition issue with expiresIn accepting string
    return this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiry,
    });
  }
}
