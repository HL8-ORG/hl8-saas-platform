import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IUserProfileRepository } from '../../../domain/users/repositories/user-profile.repository.interface';
import type { ITenantResolver } from '../../shared/interfaces/tenant-resolver.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { GetProfileInputDto } from '../dtos/get-profile.input.dto';
import { GetProfileOutputDto } from '../dtos/get-profile.output.dto';

/**
 * 获取个人资料用例
 *
 * 根据用户ID查询并返回当前用户的个人资料信息。
 *
 * @class GetProfileUseCase
 * @implements {IUseCase<GetProfileInputDto, GetProfileOutputDto>}
 * @description 获取个人资料用例
 */
@Injectable()
export class GetProfileUseCase implements IUseCase<
  GetProfileInputDto,
  GetProfileOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserProfileRepository} userProfileRepository - 用户资料仓储
   * @param {ITenantResolver} tenantResolver - 租户解析器
   */
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('ITenantResolver')
    private readonly tenantResolver: ITenantResolver,
  ) {}

  /**
   * 执行获取个人资料用例
   *
   * @param {GetProfileInputDto} input - 获取个人资料输入参数
   * @returns {Promise<GetProfileOutputDto>} 用户个人资料信息
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: GetProfileInputDto): Promise<GetProfileOutputDto> {
    const { userId } = input;

    // 获取当前租户ID
    const tenantId = this.tenantResolver.getCurrentTenantId();
    const tenantIdVo = new TenantId(tenantId);

    // 查找用户
    const user = await this.userProfileRepository.findById(userId, tenantIdVo);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return new GetProfileOutputDto({
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
