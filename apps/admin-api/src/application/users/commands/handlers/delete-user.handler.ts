import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import type { IRefreshTokenRepository } from '../../../shared/interfaces/refresh-token-repository.interface';
import { DeleteUserOutputDto } from '../../dtos/delete-user.output.dto';
import { DeleteUserCommand } from '../delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteUserCommand): Promise<DeleteUserOutputDto> {
    const { userId, tenantId } = command;

    const userIdVo = new UserId(userId);
    const tenantIdVo = new TenantId(tenantId);

    const user = await this.userProfileRepository.findById(
      userIdVo,
      tenantIdVo,
    );
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.deactivate();

    await this.userProfileRepository.delete(userIdVo, tenantIdVo);
    await this.refreshTokenRepository.deleteAll(userId, tenantId);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    return new DeleteUserOutputDto();
  }
}
