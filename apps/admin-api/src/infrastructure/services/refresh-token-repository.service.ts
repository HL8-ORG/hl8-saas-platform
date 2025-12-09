import { UlidGenerator } from '@/core/utils/id.util';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import type { IPasswordHasher } from '../../application/shared/interfaces/password-hasher.interface';
import { IRefreshTokenRepository } from '../../application/shared/interfaces/refresh-token-repository.interface';
import { RefreshToken as OrmRefreshToken } from '../persistence/typeorm/entities/refresh-token.entity';

/**
 * 刷新令牌仓储实现
 *
 * 基于 TypeORM 的刷新令牌仓储实现。
 * 负责刷新令牌的持久化和验证。
 *
 * @class RefreshTokenRepositoryService
 * @implements {IRefreshTokenRepository}
 * @description 刷新令牌仓储实现（TypeORM）
 */
@Injectable()
export class RefreshTokenRepositoryService implements IRefreshTokenRepository {
  /**
   * 构造函数
   *
   * 注入 TypeORM RefreshToken 仓储和密码哈希服务。
   *
   * @param {Repository<OrmRefreshToken>} ormRepository - TypeORM RefreshToken 仓储
   * @param {IPasswordHasher} passwordHasher - 密码哈希服务（用于验证刷新令牌）
   */
  constructor(
    @InjectRepository(OrmRefreshToken)
    private readonly ormRepository: Repository<OrmRefreshToken>,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  /**
   * 创建刷新令牌
   *
   * 创建新的刷新令牌记录。
   *
   * @param {object} data - 刷新令牌数据
   * @returns {Promise<object>} 创建的刷新令牌
   */
  async create(data: {
    token: string;
    userId: string;
    tenantId: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
  }): Promise<{
    id: string;
    token: string;
    userId: string;
    tenantId: string;
    deviceInfo: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const ormEntity = this.ormRepository.create({
      id: UlidGenerator.generate(),
      token: data.token,
      userId: data.userId,
      tenantId: data.tenantId,
      deviceInfo: data.deviceInfo || null,
      ipAddress: data.ipAddress || null,
      expiresAt: data.expiresAt,
    });

    const saved = await this.ormRepository.save(ormEntity);

    return {
      id: saved.id,
      token: saved.token,
      userId: saved.userId,
      tenantId: saved.tenantId,
      deviceInfo: saved.deviceInfo,
      ipAddress: saved.ipAddress,
      expiresAt: saved.expiresAt,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  /**
   * 查找有效令牌
   *
   * 查找用户的有效（未过期）刷新令牌列表。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Array>} 刷新令牌列表
   */
  async findValidTokens(
    userId: string,
    tenantId: string,
  ): Promise<
    Array<{
      id: string;
      token: string;
      expiresAt: Date;
    }>
  > {
    const tokens = await this.ormRepository.find({
      where: {
        userId,
        tenantId,
        expiresAt: MoreThanOrEqual(new Date()),
      },
      select: ['id', 'token', 'expiresAt'],
    });

    return tokens.map((token) => ({
      id: token.id,
      token: token.token,
      expiresAt: token.expiresAt,
    }));
  }

  /**
   * 查找所有令牌
   *
   * 查找用户的所有刷新令牌（包括已过期的）。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<Array>} 刷新令牌列表
   */
  async findAllTokens(
    userId: string,
    tenantId: string,
  ): Promise<
    Array<{
      id: string;
      token: string;
      expiresAt: Date;
    }>
  > {
    const tokens = await this.ormRepository.find({
      where: {
        userId,
        tenantId,
      },
      select: ['id', 'token', 'expiresAt'],
    });

    return tokens.map((token) => ({
      id: token.id,
      token: token.token,
      expiresAt: token.expiresAt,
    }));
  }

  /**
   * 验证并查找令牌
   *
   * 通过明文令牌验证并查找匹配的刷新令牌。
   * 使用bcrypt比较来验证令牌哈希。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @param {string} plainToken - 明文刷新令牌
   * @returns {Promise<string | null>} 如果找到匹配的令牌返回令牌ID，否则返回null
   */
  async findAndVerifyToken(
    userId: string,
    tenantId: string,
    plainToken: string,
  ): Promise<string | null> {
    // 查找所有有效令牌
    const tokens = await this.findValidTokens(userId, tenantId);

    // 使用bcrypt比较验证令牌
    for (const token of tokens) {
      const matches = await this.passwordHasher.verify(plainToken, token.token);
      if (matches) {
        return token.id;
      }
    }

    return null;
  }

  /**
   * 更新刷新令牌
   *
   * 更新指定刷新令牌的信息。
   *
   * @param {string} tokenId - 令牌ID
   * @param {object} data - 更新的数据
   * @returns {Promise<void>}
   */
  async update(
    tokenId: string,
    data: {
      token?: string;
      deviceInfo?: string;
      ipAddress?: string;
      expiresAt?: Date;
    },
  ): Promise<void> {
    await this.ormRepository.update(tokenId, data);
  }

  /**
   * 删除刷新令牌
   *
   * 删除指定的刷新令牌。
   *
   * @param {string} tokenId - 令牌ID
   * @returns {Promise<void>}
   */
  async delete(tokenId: string): Promise<void> {
    await this.ormRepository.delete(tokenId);
  }

  /**
   * 删除用户所有令牌
   *
   * 删除指定用户的所有刷新令牌。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<void>}
   */
  async deleteAll(userId: string, tenantId: string): Promise<void> {
    await this.ormRepository.delete({
      userId,
      tenantId,
    });
  }

  /**
   * 清理过期令牌
   *
   * 删除指定用户的过期刷新令牌，并保留最多5个最新的令牌。
   *
   * @param {string} userId - 用户ID
   * @param {string} tenantId - 租户ID
   * @returns {Promise<void>}
   */
  async cleanupExpired(userId: string, tenantId: string): Promise<void> {
    // 删除过期令牌
    await this.ormRepository
      .createQueryBuilder()
      .delete()
      .where('userId = :userId AND tenantId = :tenantId AND expiresAt < :now', {
        userId,
        tenantId,
        now: new Date(),
      })
      .execute();

    // 保留最多5个最新的令牌，删除多余的
    const tokens = await this.ormRepository.find({
      where: { userId, tenantId },
      order: { createdAt: 'DESC' },
      skip: 5,
      take: 100,
    });

    if (tokens.length > 0) {
      await this.ormRepository.delete({
        id: In(tokens.map((t) => t.id)),
      });
    }
  }
}
