import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import { RoleId } from '../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetRoleByIdInputDto,
  GetRoleByIdOutputDto,
} from '../dtos/get-role-by-id.input.dto';

/**
 * 根据ID获取角色用例
 *
 * 根据角色ID和租户ID查询角色信息。
 *
 * @class GetRoleByIdUseCase
 * @implements {IUseCase<GetRoleByIdInputDto, GetRoleByIdOutputDto>}
 * @description 根据ID获取角色用例
 */
@Injectable()
export class GetRoleByIdUseCase implements IUseCase<
  GetRoleByIdInputDto,
  GetRoleByIdOutputDto
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
   * 执行根据ID获取角色用例
   *
   * @param {GetRoleByIdInputDto} input - 根据ID获取角色输入参数
   * @returns {Promise<GetRoleByIdOutputDto>} 角色信息
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async execute(input: GetRoleByIdInputDto): Promise<GetRoleByIdOutputDto> {
    const { roleId, tenantId } = input;

    // 创建值对象
    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    // 查询角色
    const role = await this.roleReadRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return new GetRoleByIdOutputDto({
      id: role.id.toString(),
      name: role.name.value,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }
}
