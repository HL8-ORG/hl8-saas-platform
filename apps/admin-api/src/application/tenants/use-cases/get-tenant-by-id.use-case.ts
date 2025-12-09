import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetTenantByIdInputDto,
  GetTenantByIdOutputDto,
} from '../dtos/get-tenant-by-id.input.dto';

/**
 * 根据ID获取租户用例
 *
 * 根据租户ID查询租户信息。
 *
 * @class GetTenantByIdUseCase
 * @implements {IUseCase<GetTenantByIdInputDto, GetTenantByIdOutputDto>}
 * @description 根据ID获取租户用例
 */
@Injectable()
export class GetTenantByIdUseCase implements IUseCase<
  GetTenantByIdInputDto,
  GetTenantByIdOutputDto
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
   * 执行根据ID获取租户用例
   *
   * @param {GetTenantByIdInputDto} input - 根据ID获取租户输入参数
   * @returns {Promise<GetTenantByIdOutputDto>} 租户信息
   * @throws {NotFoundException} 当租户不存在时抛出
   */
  async execute(input: GetTenantByIdInputDto): Promise<GetTenantByIdOutputDto> {
    const { tenantId } = input;

    // 创建值对象
    const tenantIdVo = new TenantId(tenantId);

    // 查询租户
    const tenant = await this.tenantReadRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return new GetTenantByIdOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
