import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import type { IUserRepository } from '../../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import { VerifyEmailOutputDto } from '../../dtos/verify-email.output.dto';
import { VerifyEmailCommand } from '../verify-email.command';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailOutputDto> {
    const { userId, code } = command;
    // TODO: 临时修复
    const tenantIdStr = (command as any).tenantId || 'default';
    const tenantIdVo = new TenantId(tenantIdStr);
    const userIdVo = new UserId(userId);

    const user = await this.userRepository.findById(userIdVo, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.verifyEmail(code);

    await this.userRepository.save(user);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    const dto = new VerifyEmailOutputDto();
    dto.userId = user.id.toString();
    dto.email = user.email.value;
    dto.isEmailVerified = user.isEmailVerified;
    dto.message = '邮箱验证成功';
    return dto;
  }
}
