import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import { TenantDomain } from '../../../domain/tenants/value-objects/tenant-domain.vo';
import { TenantName } from '../../../domain/tenants/value-objects/tenant-name.vo';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  UpdateTenantInputDto,
  UpdateTenantOutputDto,
} from '../dtos/update-tenant.input.dto';

/**
 * 更新租户用例
 *
 * 处理租户更新业务逻辑，包括验证唯一性、更新租户聚合根等。
 *
 * @class UpdateTenantUseCase
 * @implements {IUseCase<UpdateTenantInputDto, UpdateTenantOutputDto>}
 * @description 更新租户用例
 */
@Injectable()
export class UpdateTenantUseCase implements IUseCase<
  UpdateTenantInputDto,
  UpdateTenantOutputDto
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
   * 执行更新租户用例
   *
   * @param {UpdateTenantInputDto} input - 更新租户输入参数
   * @returns {Promise<UpdateTenantOutputDto>} 更新后的租户信息
   * @throws {NotFoundException} 当租户不存在时抛出
   * @throws {ConflictException} 当租户名称或域名已存在时抛出
   */
  async execute(input: UpdateTenantInputDto): Promise<UpdateTenantOutputDto> {
    const { tenantId, name, domain, isActive } = input;

    // 创建值对象
    const tenantIdVo = new TenantId(tenantId);

    // 查找租户
    const tenant = await this.tenantRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 检查名称是否已存在（如果更新名称）
    if (name !== undefined) {
      const tenantName = new TenantName(name);
      if (!tenantName.equals(tenant.name)) {
        const existingByName =
          await this.tenantRepository.findByName(tenantName);
        if (existingByName) {
          throw new ConflictException(`租户名称 ${name} 已存在`);
        }
      }
    }

    // 检查域名是否已存在（如果更新域名）
    if (domain !== undefined) {
      const tenantDomain = domain ? new TenantDomain(domain) : null;
      const currentDomain = tenant.domain;

      // 检查域名是否改变
      const domainChanged =
        (tenantDomain === null && currentDomain !== null) ||
        (tenantDomain !== null && currentDomain === null) ||
        (tenantDomain !== null &&
          currentDomain !== null &&
          !tenantDomain.equals(currentDomain));

      if (domainChanged) {
        if (tenantDomain) {
          const existingByDomain =
            await this.tenantRepository.findByDomain(tenantDomain);
          if (existingByDomain) {
            throw new ConflictException(`租户域名 ${domain} 已存在`);
          }
        }
      }
    }

    // 更新租户信息
    const tenantName = name !== undefined ? new TenantName(name) : undefined;
    const tenantDomain =
      domain !== undefined
        ? domain
          ? new TenantDomain(domain)
          : null
        : undefined;

    tenant.update(tenantName, tenantDomain);

    // 更新激活状态
    if (isActive !== undefined) {
      if (isActive && !tenant.isActive) {
        tenant.activate();
      } else if (!isActive && tenant.isActive) {
        tenant.deactivate();
      }
    }

    // 保存租户
    await this.tenantRepository.save(tenant);

    // 发布领域事件
    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new UpdateTenantOutputDto({
      id: tenant.id.toString(),
      name: tenant.name.value,
      domain: tenant.domain?.value ?? null,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    });
  }
}
