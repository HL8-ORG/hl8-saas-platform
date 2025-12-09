import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { ITenantRepository } from '../../../domain/tenants/repositories/tenant.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  DeleteTenantInputDto,
  DeleteTenantOutputDto,
} from '../dtos/delete-tenant.input.dto';

/**
 * 删除租户用例
 *
 * 处理租户删除业务逻辑。
 *
 * **注意**：删除租户前应确保该租户下没有用户或其他关联数据。
 *
 * @class DeleteTenantUseCase
 * @implements {IUseCase<DeleteTenantInputDto, DeleteTenantOutputDto>}
 * @description 删除租户用例
 */
@Injectable()
export class DeleteTenantUseCase implements IUseCase<
  DeleteTenantInputDto,
  DeleteTenantOutputDto
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
   * 执行删除租户用例
   *
   * @param {DeleteTenantInputDto} input - 删除租户输入参数
   * @returns {Promise<DeleteTenantOutputDto>} 删除成功消息
   * @throws {NotFoundException} 当租户不存在时抛出
   */
  async execute(input: DeleteTenantInputDto): Promise<DeleteTenantOutputDto> {
    const { tenantId } = input;

    // 创建值对象
    const tenantIdVo = new TenantId(tenantId);

    // 查找租户
    const tenant = await this.tenantRepository.findById(tenantIdVo);
    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    // 标记删除（发布领域事件）
    tenant.delete();

    // 物理删除租户
    await this.tenantRepository.delete(tenantIdVo);

    // 发布领域事件
    const domainEvents = tenant.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      tenant.commit();
    }

    return new DeleteTenantOutputDto({
      message: '租户删除成功',
    });
  }
}
