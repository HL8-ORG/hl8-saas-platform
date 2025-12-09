import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { UpdateUserInputDto } from '../dtos/update-user.input.dto';
import { UpdateUserOutputDto } from '../dtos/update-user.output.dto';

/**
 * 更新用户用例
 *
 * 管理员更新指定用户的信息。
 *
 * @class UpdateUserUseCase
 * @implements {IUseCase<UpdateUserInputDto, UpdateUserOutputDto>}
 * @description 更新用户用例
 */
@Injectable()
export class UpdateUserUseCase implements IUseCase<
  UpdateUserInputDto,
  UpdateUserOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserProfileRepository} userProfileRepository - 用户资料仓储
   * @param {IEventBus} eventBus - 事件总线
   */
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 执行更新用户用例
   *
   * @param {UpdateUserInputDto} input - 更新用户输入参数
   * @returns {Promise<UpdateUserOutputDto>} 更新后的用户信息
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: UpdateUserInputDto): Promise<UpdateUserOutputDto> {
    const { userId, tenantId, fullName, role, isActive } = input;

    // 查找用户
    const user = await this.userProfileRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 更新用户资料
    if (fullName !== undefined) {
      user.updateProfile(fullName);
    }

    // 更新用户角色
    // 注意：User聚合根目前没有changeRole方法
    // 这里需要直接修改私有属性，未来应该添加changeRole业务方法
    if (role !== undefined && user.role !== role) {
      // 使用类型断言访问私有属性（临时方案）
      // TODO: 在User聚合根中添加changeRole业务方法
      (user as any)._role = role;
      (user as any)._updatedAt = new Date();
    }

    // 更新激活状态
    if (isActive !== undefined) {
      if (isActive && !user.isActive) {
        user.activate();
      } else if (!isActive && user.isActive) {
        user.deactivate();
      }
    }

    // 保存用户
    await this.userProfileRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
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
