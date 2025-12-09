import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IJwtService } from '../../../shared/interfaces/jwt-service.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { RefreshTokenOutputDto } from '../../dtos/refresh-token.output.dto';
import { RefreshTokenCommand } from '../refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IJwtService')
    private readonly jwtService: IJwtService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenOutputDto> {
    const { userId, refreshToken, ipAddress, userAgent } = command;
    // TODO: 临时修复，需要从 command 获取 tenantId
    const tenantIdStr = (command as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantIdStr);
    const userIdVo = new UserId(userId);

    const user = await this.userRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 验证刷新令牌
    const tokenId = await this.refreshTokenRepository.findAndVerifyToken(
      userId,
      user.tenantId.toString(),
      refreshToken,
    );

    if (!tokenId) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 删除旧的刷新令牌
    await this.refreshTokenRepository.delete(tokenId);

    const payload = {
      sub: user.id.toString(),
      email: user.email.value,
      role: user.role,
      tenantId: user.tenantId.toString(),
    };

    const newAccessToken = await this.jwtService.signAccessToken(payload);
    const newRefreshToken = await this.jwtService.signRefreshToken(payload);

    await this.refreshTokenRepository.create({
      userId: user.id.toString(),
      tenantId: user.tenantId.toString(),
      token: newRefreshToken,
      ipAddress,
      deviceInfo: userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const dto = new RefreshTokenOutputDto();
    dto.accessToken = newAccessToken;
    dto.refreshToken = newRefreshToken;
    return dto;
  }
}
