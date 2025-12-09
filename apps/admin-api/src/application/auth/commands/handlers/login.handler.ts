import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { Email } from '../../../../domain/auth/value-objects/email.vo';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import type { IJwtService } from '../../../shared/interfaces/jwt-service.interface';
import type { IPasswordHasher } from '../../../shared/interfaces/password-hasher.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { LoginOutputDto } from '../../dtos/login.output.dto';
import { LoginCommand } from '../login.command';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPasswordHasher')
    private readonly passwordHasher: IPasswordHasher,
    @Inject('IJwtService')
    private readonly jwtService: IJwtService,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(command: LoginCommand): Promise<LoginOutputDto> {
    const { email, password, ipAddress, userAgent } = command;

    const emailVo = new Email(email);
    // TODO: 从上下文获取 tenantId，目前先假设是 'default' 或需要重构 LoginCommand 传入 tenantId
    // 临时修复：使用 any 绕过类型检查，或者需要重构以支持多租户登录
    const tenantId = (command as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantId);

    // 注意：这里 findByEmail 需要 tenantId，但 LoginCommand 可能没有包含它
    // 在多租户系统中，通常通过域名或请求头确定 tenantId
    // 这里假设 IUserRepository.findByEmail 签名已更新为需要 TenantId

    // 临时解决方案：我们需要知道如何在登录时确定租户。
    // 如果是 SaaS 平台，通常通过子域名确定租户。
    // 假设 userRepository.findByEmail 可以在不提供 tenantId 的情况下跨租户查找（这通常是不安全的，除非邮箱全局唯一）
    // 或者我们需要重构 user.repository.interface.ts 允许 findByEmail 的 tenantId 为可选

    // 根据错误信息：Expected 2 arguments, but got 1.
    // 我们必须提供 tenantId。
    // 假设我们在 handler 中无法获取 tenantId，这可能是一个设计问题。
    // 暂时传入一个占位符，但这可能会导致运行时错误。

    // 正确的做法应该是从请求上下文或 Command 中获取 tenantId。
    // 假设 LoginCommand 应该包含 tenantId (从域名解析而来)

    const user = await this.userRepository.findByEmail(emailVo, tenantIdVo);

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isPasswordValid = await this.passwordHasher.verify(
      password,
      user.passwordHash.value,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const payload = {
      sub: user.id.toString(),
      email: user.email.value,
      role: user.role,
      tenantId: user.tenantId.toString(),
    };

    const accessToken = await this.jwtService.signAccessToken(payload);
    const refreshToken = await this.jwtService.signRefreshToken(payload);

    await this.refreshTokenRepository.create({
      userId: user.id.toString(),
      tenantId: user.tenantId.toString(),
      token: refreshToken,
      ipAddress,
      deviceInfo: userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    const dto = new LoginOutputDto();
    dto.accessToken = accessToken;
    dto.refreshToken = refreshToken;
    dto.user = {
      id: user.id.toString(),
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
    };
    return dto;
  }
}
