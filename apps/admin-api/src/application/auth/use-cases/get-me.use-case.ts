import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/auth/repositories/user.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { UserId } from '../../../domain/shared/value-objects/user-id.vo';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { GetMeInputDto } from '../dtos/get-me.input.dto';
import { GetMeOutputDto } from '../dtos/get-me.output.dto';

/**
 * 获取当前用户用例
 *
 * 根据用户ID查询并返回当前用户信息。
 *
 * @class GetMeUseCase
 * @implements {IUseCase<GetMeInputDto, GetMeOutputDto>}
 * @description 获取当前用户用例
 */
@Injectable()
export class GetMeUseCase implements IUseCase<GetMeInputDto, GetMeOutputDto> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserRepository} userRepository - 用户仓储
   * @param {ITenantResolver} tenantResolver - 租户解析器
   */
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 执行获取当前用户用例
   *
   * @param {GetMeInputDto} input - 获取用户输入参数
   * @returns {Promise<GetMeOutputDto>} 用户信息
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: GetMeInputDto): Promise<GetMeOutputDto> {
    const { userId: userIdStr } = input;

    // 获取当前租户ID
    const tenantIdStr = this.tenantResolver.getCurrentTenantId();
    const tenantId = new TenantId(tenantIdStr);

    // 创建用户ID值对象
    const userId = new UserId(userIdStr);

    // 查找用户
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id.toString(),
      email: user.email.value,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
