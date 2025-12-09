import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Tenant } from '../../../domain/tenants/entities/tenant.aggregate';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantDomain } from '../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../domain/tenants/value-objects/tenant-name.vo';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  CreateTenantInputDto,
  CreateTenantOutputDto,
} from '../dtos/create-tenant.input.dto';

/**
 * 创建租户用例
 *
 * 处理租户创建业务逻辑，包括验证唯一性、创建租户聚合根等。
 *
 * @class CreateTenantUseCase
 * @implements {IUseCase<CreateTenantInputDto, CreateTenantOutputDto>}
 * @description 创建租户用例
 */
@Injectable()
export class CreateTenantUseCase implements IUseCase<
  CreateTenantInputDto,
  CreateTenantOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {ITenantRepository} tenantRepository - 租户仓储
   * @param {IEventBus} eventBus - 事件总线
   */
  constructor(
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 执行创建租户用例
   *
   * @param {CreateTenantInputDto} input - 创建租户输入参数
   * @returns {Promise<CreateTenantOutputDto>} 创建的租户信息
   * @throws {ConflictException} 当租户名称或域名已存在时抛出
   */
  async execute(input: CreateTenantInputDto): Promise<CreateTenantOutputDto> {
    const { name, domain, isActive } = input;

    // 创建值对象
    const tenantName = new TenantName(name);
    const tenantDomain = domain ? new TenantDomain(domain) : null;

    // 检查名称是否已存在
    const existingByName = await this.tenantRepository.findByName(tenantName);
    if (existingByName) {
      throw new ConflictException(`租户名称 ${name} 已存在`);
    }

    // 检查域名是否已存在（如果提供）
    if (tenantDomain) {
      const existingByDomain =
        await this.tenantRepository.findByDomain(tenantDomain);
      if (existingByDomain) {
        throw new ConflictException(`租户域名 ${domain} 已存在`);
      }
    }

    // 创建租户聚合根
    const tenant = Tenant.create(tenantName, tenantDomain, isActive);

    // 保存租户
    await this.tenantRepository.save(tenant);

    // 发布领域事件
    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new CreateTenantOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
