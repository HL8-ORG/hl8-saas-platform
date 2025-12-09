import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IUserReadRepository } from '../../../domain/users/repositories/user-read.repository.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { GetUserByIdInputDto } from '../dtos/get-user-by-id.input.dto';
import { GetUserByIdOutputDto } from '../dtos/get-user-by-id.output.dto';

/**
 * 根据ID获取用户用例
 *
 * 根据用户ID查询并返回用户信息。
 *
 * @class GetUserByIdUseCase
 * @implements {IUseCase<GetUserByIdInputDto, GetUserByIdOutputDto>}
 * @description 根据ID获取用户用例
 */
@Injectable()
export class GetUserByIdUseCase implements IUseCase<
  GetUserByIdInputDto,
  GetUserByIdOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IUserReadRepository} userReadRepository - 用户只读仓储
   */
  constructor(
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  /**
   * 执行根据ID获取用户用例
   *
   * @param {GetUserByIdInputDto} input - 根据ID获取用户输入参数
   * @returns {Promise<GetUserByIdOutputDto>} 用户信息
   * @throws {NotFoundException} 当用户不存在时抛出
   */
  async execute(input: GetUserByIdInputDto): Promise<GetUserByIdOutputDto> {
    const { userId, tenantId } = input;

    // 查找用户
    const user = await this.userReadRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return new GetUserByIdOutputDto({
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
