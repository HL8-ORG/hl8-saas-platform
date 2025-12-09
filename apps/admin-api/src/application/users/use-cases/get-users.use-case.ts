import { Inject, Injectable } from '@nestjs/common';
import type { IUserReadRepository } from '../../../domain/users/repositories/user-read.repository.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import { GetProfileOutputDto } from '../dtos/get-profile.output.dto';
import { GetUsersInputDto } from '../dtos/get-users.input.dto';
import { GetUsersOutputDto } from '../dtos/get-users.output.dto';

/**
 * 获取用户列表用例
 *
 * 根据查询参数分页查询用户列表。
 *
 * @class GetUsersUseCase
 * @implements {IUseCase<GetUsersInputDto, GetUsersOutputDto>}
 * @description 获取用户列表用例
 */
@Injectable()
export class GetUsersUseCase implements IUseCase<
  GetUsersInputDto,
  GetUsersOutputDto
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
   * 执行获取用户列表用例
   *
   * @param {GetUsersInputDto} input - 获取用户列表输入参数
   * @returns {Promise<GetUsersOutputDto>} 用户列表和分页元数据
   */
  async execute(input: GetUsersInputDto): Promise<GetUsersOutputDto> {
    const { tenantId, page, limit, isActive, search } = input;

    // 查询用户列表
    const result = await this.userReadRepository.findMany({
      tenantId,
      page,
      limit,
      isActive,
      search,
    });

    // 转换为输出DTO
    const data = result.data.map(
      (user) =>
        new GetProfileOutputDto({
          id: user.id.toString(),
          email: user.email.value,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
    );

    return new GetUsersOutputDto({
      data,
      meta: result.meta,
    });
  }
}
