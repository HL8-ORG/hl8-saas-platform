import { Inject, Injectable } from '@nestjs/common';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetTenantOutputDto,
  GetTenantsInputDto,
  GetTenantsOutputDto,
} from '../dtos/get-tenants.input.dto';

/**
 * 获取租户列表用例
 *
 * 查询系统中的所有租户。
 *
 * @class GetTenantsUseCase
 * @implements {IUseCase<GetTenantsInputDto, GetTenantsOutputDto>}
 * @description 获取租户列表用例
 */
@Injectable()
export class GetTenantsUseCase implements IUseCase<
  GetTenantsInputDto,
  GetTenantsOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {ITenantReadRepository} tenantReadRepository - 租户只读仓储
   */
  constructor(
    @Inject('ITenantReadRepository')
    private readonly tenantReadRepository: ITenantReadRepository,
  ) {}

  /**
   * 执行获取租户列表用例
   *
   * @param {GetTenantsInputDto} input - 获取租户列表输入参数
   * @returns {Promise<GetTenantsOutputDto>} 租户列表
   */
  async execute(input: GetTenantsInputDto): Promise<GetTenantsOutputDto> {
    // 查询所有租户
    const tenants = await this.tenantReadRepository.findAll();

    // 转换为输出DTO
    const data = tenants.map(
      (tenant) =>
        new GetTenantOutputDto({
          id: tenant.id.toString(),
          name: tenant.name.value,
          domain: tenant.domain?.value ?? null,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
        }),
    );

    return new GetTenantsOutputDto({ data });
  }
}
