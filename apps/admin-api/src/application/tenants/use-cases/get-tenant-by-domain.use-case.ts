import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ITenantReadRepository } from '../../../domain/tenants/repositories/tenant-read.repository.interface';
import { TenantDomain } from '../../../domain/tenants/value-objects/tenant-domain.vo';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetTenantByDomainInputDto,
  GetTenantByDomainOutputDto,
} from '../dtos/get-tenant-by-domain.input.dto';

/**
 * 根据域名获取租户用例
 *
 * 根据租户域名查询租户信息。
 *
 * @class GetTenantByDomainUseCase
 * @implements {IUseCase<GetTenantByDomainInputDto, GetTenantByDomainOutputDto>}
 * @description 根据域名获取租户用例
 */
@Injectable()
export class GetTenantByDomainUseCase implements IUseCase<
  GetTenantByDomainInputDto,
  GetTenantByDomainOutputDto
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
   * 执行根据域名获取租户用例
   *
   * @param {GetTenantByDomainInputDto} input - 根据域名获取租户输入参数
   * @returns {Promise<GetTenantByDomainOutputDto>} 租户信息
   * @throws {NotFoundException} 当租户不存在时抛出
   */
  async execute(
    input: GetTenantByDomainInputDto,
  ): Promise<GetTenantByDomainOutputDto> {
    const { domain } = input;

    // 创建值对象
    const tenantDomain = new TenantDomain(domain);

    // 查询租户
    const tenant = await this.tenantReadRepository.findByDomain(tenantDomain);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return new GetTenantByDomainOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
