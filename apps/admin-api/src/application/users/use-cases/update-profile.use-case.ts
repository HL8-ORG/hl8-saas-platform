import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { UpdateProfileInputDto } from '../dtos/update-profile.input.dto';
import { UpdateProfileOutputDto } from '../dtos/update-profile.output.dto';

/**
 * 更新个人资料用例
 *
 * 更新当前用户的个人资料信息。
 *
 * @class UpdateProfileUseCase
 * @implements {IUseCase<UpdateProfileInputDto, UpdateProfileOutputDto>}
 * @description 更新个人资料用例
 */
@Injectable()
export class UpdateProfileUseCase implements IUseCase<
  UpdateProfileInputDto,
  UpdateProfileOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserProfileRepository} userProfileRepository - 用户资料仓储
   * @param {IEventBus} eventBus - 事件总线
   * @param {ITenantResolver} tenantResolver - 租户解析器
   */
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 执行更新个人资料用例
   *
   * @param {UpdateProfileInputDto} input - 更新个人资料输入参数
   * @returns {Promise<UpdateProfileOutputDto>} 更新后的用户个人资料信息
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: UpdateProfileInputDto): Promise<UpdateProfileOutputDto> {
    const { userId, fullName } = input;

    // 获取当前租户ID
    const tenantId = this.tenantResolver.getCurrentTenantId();
    const tenantIdVo = new TenantId(tenantId);

    // 查找用户
    const user = await this.userProfileRepository.findById(userId, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 更新用户资料
    if (fullName !== undefined) {
      user.updateProfile(fullName);
    }

    // 保存用户
    await this.userProfileRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
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
