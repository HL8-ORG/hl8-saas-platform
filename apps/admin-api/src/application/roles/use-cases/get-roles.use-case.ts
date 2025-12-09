import { Inject, Injectable } from '@nestjs/common';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetRoleOutputDto,
  GetRolesInputDto,
  GetRolesOutputDto,
} from '../dtos/get-roles.input.dto';

/**
 * 获取角色列表用例
 *
 * 查询指定租户下的所有角色。
 *
 * @class GetRolesUseCase
 * @implements {IUseCase<GetRolesInputDto, GetRolesOutputDto>}
 * @description 获取角色列表用例
 */
@Injectable()
export class GetRolesUseCase implements IUseCase<
  GetRolesInputDto,
  GetRolesOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IRoleReadRepository} roleReadRepository - 角色只读仓储
   */
  constructor(
    @Inject('IRoleReadRepository')
    private readonly roleReadRepository: IRoleReadRepository,
  ) {}

  /**
   * 执行获取角色列表用例
   *
   * @param {GetRolesInputDto} input - 获取角色列表输入参数
   * @returns {Promise<GetRolesOutputDto>} 角色列表
   */
  async execute(input: GetRolesInputDto): Promise<GetRolesOutputDto> {
    const { tenantId } = input;

    // 创建值对象
    const tenantIdVo = new TenantId(tenantId);

    // 查询所有角色
    const roles = await this.roleReadRepository.findAll(tenantIdVo);

    // 转换为输出DTO
    const data = roles.map(
      (role) =>
        new GetRoleOutputDto({
          id: role.id.toString(),
          name: role.name.value,
          displayName: role.displayName,
          description: role.description,
          isActive: role.isActive,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
        }),
    );

    return new GetRolesOutputDto({ data });
  }
}
