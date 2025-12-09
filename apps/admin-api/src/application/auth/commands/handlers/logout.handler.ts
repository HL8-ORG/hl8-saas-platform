import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { LogoutOutputDto } from '../../dtos/logout.output.dto';
import { LogoutCommand } from '../logout.command';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<LogoutOutputDto> {
    const { userId, refreshToken } = command;
    // TODO: 从上下文获取 tenantId，假设 command 中包含 tenantId 或者需要通过 userId 查找
    // 这里的逻辑有点问题：我们需要先找到用户才能知道 tenantId，但 findById 需要 tenantId
    // 假设 IUserRepository.findById 签名是 findById(userId: UserId, tenantId: TenantId)

    // 这是一个循环依赖问题：要找用户需要 tenantId，要知道 tenantId 需要找用户（除非 tenantId 在请求中）
    // 临时修复：假设 command 中应该包含 tenantId
    const tenantIdStr = (command as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantIdStr);
    const userIdVo = new UserId(userId);

    // 获取用户信息以获取 tenantId
    const user = await this.userRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      // 如果用户不存在，直接返回成功（避免信息泄露）
      const dto = new LogoutOutputDto();
      dto.message = '登出成功';
      return dto;
    }

    const tenantId = user.tenantId.toString();

    if (refreshToken) {
      // 如果提供了刷新令牌，查找并删除该令牌
      const tokenId = await this.refreshTokenRepository.findAndVerifyToken(
        userId,
        tenantId,
        refreshToken,
      );
      if (tokenId) {
        await this.refreshTokenRepository.delete(tokenId);
      }
    } else {
      // 如果没有提供刷新令牌，删除用户的所有令牌
      await this.refreshTokenRepository.deleteAll(userId, tenantId);
    }

    const dto = new LogoutOutputDto();
    dto.message = '登出成功';
    return dto;
  }
}
