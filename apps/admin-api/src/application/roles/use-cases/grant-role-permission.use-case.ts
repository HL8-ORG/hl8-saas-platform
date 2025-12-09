import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import { RoleId } from '../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { AuthZService } from '../../../lib/casbin/services/authz.service';
import type { IPermissionsService } from '../../shared/interfaces/permissions-service.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GrantRolePermissionInputDto,
  GrantRolePermissionOutputDto,
} from '../dtos/grant-role-permission.input.dto';

/**
 * 授予角色权限用例
 *
 * 处理为角色授予权限的业务逻辑，包括更新Permission实体和Casbin策略。
 *
 * @class GrantRolePermissionUseCase
 * @implements {IUseCase<GrantRolePermissionInputDto, GrantRolePermissionOutputDto>}
 * @description 授予角色权限用例
 */
@Injectable()
export class GrantRolePermissionUseCase implements IUseCase<
  GrantRolePermissionInputDto,
  GrantRolePermissionOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IRoleRepository} roleRepository - 角色仓储
   * @param {IEventBus} eventBus - 事件总线
   * @param {AuthZService} authzService - 授权服务
   * @param {IPermissionsService} permissionsService - 权限服务
   */
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,
    private readonly authzService: AuthZService,
    @Inject('IPermissionsService')
    private readonly permissionsService: IPermissionsService,
  ) {}

  /**
   * 执行授予角色权限用例
   *
   * @param {GrantRolePermissionInputDto} input - 授予角色权限输入参数
   * @returns {Promise<GrantRolePermissionOutputDto>} 授权结果
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async execute(
    input: GrantRolePermissionInputDto,
  ): Promise<GrantRolePermissionOutputDto> {
    const { roleId, tenantId, resource, action, description } = input;

    // 创建值对象
    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    // 查找角色
    const role = await this.roleRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    if (!role.isActive) {
      throw new BadRequestException(`角色 ${role.name.value} 未激活`);
    }

    // 创建或获取权限实体（会自动使用当前租户 ID）
    const permission = await this.permissionsService.createOrGet({
      resource,
      action,
      description,
    });

    // 在 Permission 实体中关联角色和权限
    await this.permissionsService.assignPermissionToRole(
      role.id.toString(),
      permission.id,
    );

    // 在 Casbin 中添加角色-权限关联（用于权限检查，传递租户ID以实现多租户隔离）
    const success = await this.authzService.addPolicy(
      role.name.value,
      tenantId,
      resource,
      action,
    );

    // 发布领域事件
    role.grantPermission(resource, action);
    const domainEvents = role.getUncommittedEvents();
    if (domainEvents.length > 0) {
      await this.eventBus.publishAll(domainEvents);
      role.commit();
    }

    return new GrantRolePermissionOutputDto({
      success,
      message: success ? '权限授予成功' : '权限授予失败',
    });
  }
}
