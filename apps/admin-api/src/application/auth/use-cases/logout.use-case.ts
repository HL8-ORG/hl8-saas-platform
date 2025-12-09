import { Logger } from '@hl8/logger';
import { Inject, Injectable } from '@nestjs/common';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import type { IPasswordHasher } from '../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { LogoutInputDto } from '../dtos/logout.input.dto';
import { LogoutOutputDto } from '../dtos/logout.output.dto';

/**
 * 用户登出用例
 *
 * 处理用户登出业务逻辑，包括删除刷新令牌。
 *
 * @class LogoutUseCase
 * @implements {IUseCase<LogoutInputDto, LogoutOutputDto>}
 * @description 用户登出用例
 */
@Injectable()
export class LogoutUseCase implements IUseCase<
  LogoutInputDto,
  LogoutOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {IRefreshTokenRepository} refreshTokenRepository - 刷新令牌仓储
   * @param {IPasswordHasher} passwordHasher - 密码哈希服务（用于验证刷新令牌）
   * @param {Logger} logger - 日志服务
   */
  constructor(
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    private readonly logger: Logger,
  ) {}

  /**
   * 执行用户登出用例
   *
   * **业务规则**：
   * - 如果提供了刷新令牌，只删除该令牌（单设备登出）
   * - 如果未提供刷新令牌，删除用户的所有刷新令牌（全设备登出）
   *
   * @param {LogoutInputDto} input - 登出输入参数
   * @returns {Promise<LogoutOutputDto>} 登出结果
   */
  async execute(input: LogoutInputDto): Promise<LogoutOutputDto> {
    const { userId: userIdStr, refreshToken } = input;

    // 获取当前租户ID
    const tenantId = this.tenantResolver.getCurrentTenantId();

    // 创建用户ID值对象（用于验证）
    const userId = new UserId(userIdStr);

    if (refreshToken) {
      // 单设备登出：查找并删除指定的刷新令牌
      const tokenId = await this.refreshTokenRepository.findAndVerifyToken(
        userId.toString(),
        tenantId,
        refreshToken,
      );

      if (tokenId) {
        await this.refreshTokenRepository.delete(tokenId);
      }
    } else {
      // 全设备登出：删除用户的所有刷新令牌
      await this.refreshTokenRepository.deleteAll(userId.toString(), tenantId);
    }

    this.logger.log({
      message: 'User logged out',
      userId: userId.toString(),
      singleDevice: !!refreshToken,
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
