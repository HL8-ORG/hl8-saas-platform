import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { IEventBus } from '../../../infrastructure/events';
import type { IRefreshTokenRepository } from '../../shared/interfaces/refresh-token-repository.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { DeleteUserInputDto } from '../dtos/delete-user.input.dto';
import { DeleteUserOutputDto } from '../dtos/delete-user.output.dto';

/**
 * 删除用户用例
 *
 * 软删除指定用户，将用户设置为非激活状态。
 *
 * @class DeleteUserUseCase
 * @implements {IUseCase<DeleteUserInputDto, DeleteUserOutputDto>}
 * @description 删除用户用例
 */
@Injectable()
export class DeleteUserUseCase implements IUseCase<
  DeleteUserInputDto,
  DeleteUserOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserProfileRepository} userProfileRepository - 用户资料仓储
   * @param {IEventBus} eventBus - 事件总线
   * @param {IRefreshTokenRepository} refreshTokenRepository - 刷新令牌仓储
   */
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    @Inject('IRefreshTokenRepository')
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * 执行删除用户用例
   *
   * @param {DeleteUserInputDto} input - 删除用户输入参数
   * @returns {Promise<DeleteUserOutputDto>} 删除操作结果
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: DeleteUserInputDto): Promise<DeleteUserOutputDto> {
    const { userId, tenantId } = input;

    // 查找用户
    const user = await this.userProfileRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 软删除用户（设置为非激活状态）
    user.deactivate();

    // 保存用户
    await this.userProfileRepository.save(user);

    // 发布领域事件
    const domainEvents = user.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      user.commit();
    }

    // 删除用户的所有刷新令牌，强制所有设备登出
    await this.refreshTokenRepository.deleteAll(
      userId.toString(),
      tenantId.toString(),
    );

    return new DeleteUserOutputDto();
  }
}
