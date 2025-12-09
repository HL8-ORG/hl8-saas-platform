import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import { RoleName } from '../../../domain/roles/value-objects/role-name.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  CreateRoleInputDto,
  CreateRoleOutputDto,
} from '../dtos/create-role.input.dto';

/**
 * 创建角色用例
 *
 * 处理角色创建业务逻辑，包括验证唯一性、创建角色聚合根等。
 *
 * @class CreateRoleUseCase
 * @implements {IUseCase<CreateRoleInputDto, CreateRoleOutputDto>}
 * @description 创建角色用例
 */
@Injectable()
export class CreateRoleUseCase implements IUseCase<
  CreateRoleInputDto,
  CreateRoleOutputDto
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
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 执行创建角色用例
   *
   * @param {CreateRoleInputDto} input - 创建角色输入参数
   * @returns {Promise<CreateRoleOutputDto>} 创建的角色信息
   * @throws {ConflictException} 当角色名称已存在时抛出
   */
  async execute(input: CreateRoleInputDto): Promise<CreateRoleOutputDto> {
    const { tenantId, name, displayName, description, isActive } = input;

    // 创建值对象
    const tenantIdVo = new TenantId(tenantId);
    const roleName = new RoleName(name);

    // 检查名称是否已存在
    const existing = await this.roleRepository.findByName(roleName, tenantIdVo);
    if (existing) {
      throw new ConflictException(`角色 ${name} 已存在`);
    }

    // 创建角色聚合根
    const role = Role.create(
      roleName,
      tenantIdVo,
      displayName,
      description,
      isActive,
    );

    // 保存角色
    await this.roleRepository.save(role);

    // 发布领域事件
    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new CreateRoleOutputDto({
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
