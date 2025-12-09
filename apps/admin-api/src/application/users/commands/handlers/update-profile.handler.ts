import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import type { ITenantResolver } from '../../../shared/interfaces/tenant-resolver.interface';
import { UpdateProfileOutputDto } from '../../dtos/update-profile.output.dto';
import { UpdateProfileCommand } from '../update-profile.command';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: UpdateProfileCommand,
  ): Promise<UpdateProfileOutputDto> {
    const { userId, fullName } = command;
    const tenantId = this.tenantResolver.getCurrentTenantId();

    const userIdVo = new UserId(userId);
    const tenantIdVo = new TenantId(tenantId);

    const user = await this.userProfileRepository.findById(
      userIdVo,
      tenantIdVo,
    );
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.updateProfile(fullName);

    await this.userProfileRepository.save(user);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    return new UpdateProfileOutputDto({
      id: user.id.toString(),
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
