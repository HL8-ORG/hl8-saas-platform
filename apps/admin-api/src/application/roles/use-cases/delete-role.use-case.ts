import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import { RoleId } from '../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  DeleteRoleInputDto,
  DeleteRoleOutputDto,
} from '../dtos/delete-role.input.dto';

/**
 * 删除角色用例
 *
 * 处理角色删除业务逻辑。
 *
 * **注意**：删除角色前应确保该角色没有被分配给任何用户。
 *
 * @class DeleteRoleUseCase
 * @implements {IUseCase<DeleteRoleInputDto, DeleteRoleOutputDto>}
 * @description 删除角色用例
 */
@Injectable()
export class DeleteRoleUseCase implements IUseCase<
  DeleteRoleInputDto,
  DeleteRoleOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IRoleRepository} roleRepository - 角色仓储
   * @param {IEventBus} eventBus - 事件总线
   */
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 执行删除角色用例
   *
   * @param {DeleteRoleInputDto} input - 删除角色输入参数
   * @returns {Promise<DeleteRoleOutputDto>} 删除成功消息
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async execute(input: DeleteRoleInputDto): Promise<DeleteRoleOutputDto> {
    const { roleId, tenantId } = input;

    // 创建值对象
    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    // 查找角色
    const role = await this.roleRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 标记删除（发布领域事件）
    role.delete();

    // 物理删除角色
    await this.roleRepository.delete(roleIdVo, tenantIdVo);

    // 发布领域事件
    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new DeleteRoleOutputDto({
      message: '角色删除成功',
    });
  }
}
