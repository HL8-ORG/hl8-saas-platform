import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { ResendVerificationOutputDto } from '../../dtos/resend-verification.output.dto';
import { ResendVerificationCommand } from '../resend-verification.command';

@CommandHandler(ResendVerificationCommand)
export class ResendVerificationHandler implements ICommandHandler<ResendVerificationCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ResendVerificationCommand,
  ): Promise<ResendVerificationOutputDto> {
    const { userId } = command;
    // TODO: 临时修复
    const tenantIdStr = (command as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantIdStr);
    const userIdVo = new UserId(userId);

    const user = await this.userRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.resendVerificationCode();

    await this.userRepository.save(user);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    const dto = new ResendVerificationOutputDto();
    dto.email = user.email.value;
    dto.message = '验证码已重新发送';
    return dto;
  }
}
