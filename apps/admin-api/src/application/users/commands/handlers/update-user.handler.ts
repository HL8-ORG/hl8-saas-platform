import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TenantId } from '../../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../../domain/shared/value-objects/user-id.vo';
import type { IUserProfileRepository } from '../../../../domain/users/repositories/user-profile.repository.interface';
import { UpdateUserOutputDto } from '../../dtos/update-user.output.dto';
import { UpdateUserCommand } from '../update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserOutputDto> {
    const { userId, tenantId, fullName, role, isActive } = command;

    const userIdVo = new UserId(userId);
    const tenantIdVo = new TenantId(tenantId);

    const user = await this.userProfileRepository.findById(
      userIdVo,
      tenantIdVo,
    );
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (fullName !== undefined) {
      user.updateProfile(fullName);
    }

    if (role !== undefined && user.role !== role) {
      (user as any)._role = role;
      (user as any)._updatedAt = new Date();
    }

    if (isActive !== undefined) {
      if (isActive && !user.isActive) {
        user.activate();
      } else if (!isActive && user.isActive) {
        user.deactivate();
      }
    }

    await this.userProfileRepository.save(user);

    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    return new UpdateUserOutputDto({
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
