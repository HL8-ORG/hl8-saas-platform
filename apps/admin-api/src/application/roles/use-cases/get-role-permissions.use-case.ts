import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import { RoleId } from '../../../domain/shared/value-objects/role-id.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import type { IPermissionsService } from '../../shared/interfaces/permissions-service.interface';
import { IUseCase } from '../../shared/interfaces/use-case.interface';
import {
  GetRolePermissionsInputDto,
  GetRolePermissionsOutputDto,
  PermissionInfo,
} from '../dtos/get-role-permissions.input.dto';

/**
 * 获取角色权限用例
 *
 * 查询角色的所有权限。
 * 优先从 Permission 实体获取（包含元数据），如果没有则从 Casbin 获取。
 *
 * @class GetRolePermissionsUseCase
 * @implements {IUseCase<GetRolePermissionsInputDto, GetRolePermissionsOutputDto>}
 * @description 获取角色权限用例
 */
@Injectable()
export class GetRolePermissionsUseCase implements IUseCase<
  GetRolePermissionsInputDto,
  GetRolePermissionsOutputDto
> {
  /**
   * 构造函数
   *
   * 注入用例所需的依赖。
   *
   * @param {IRoleReadRepository} roleReadRepository - 角色只读仓储
   * @param {IPermissionsService} permissionsService - 权限服务
   */
  constructor(
    @Inject('IRoleReadRepository')
    private readonly roleReadRepository: IRoleReadRepository,
    @Inject('IPermissionsService')
    private readonly permissionsService: IPermissionsService,
  ) {}

  /**
   * 执行获取角色权限用例
   *
   * @param {GetRolePermissionsInputDto} input - 获取角色权限输入参数
   * @returns {Promise<GetRolePermissionsOutputDto>} 权限列表
   * @throws {NotFoundException} 当角色不存在时抛出
   */
  async execute(
    input: GetRolePermissionsInputDto,
  ): Promise<GetRolePermissionsOutputDto> {
    const { roleId, tenantId, withDetails } = input;

    // 创建值对象
    const roleIdVo = new RoleId(roleId);
    const tenantIdVo = new TenantId(tenantId);

    // 查找角色
    const role = await this.roleReadRepository.findById(roleIdVo, tenantIdVo);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 从 Permission 实体获取权限（包含完整信息）
    const permissions = await this.permissionsService.getRolePermissions(
      role.id.toString(),
    );

    // 转换为输出DTO
    const permissionInfos = permissions.map(
      (p) => new PermissionInfo({ resource: p.resource, action: p.action }),
    );

    return new GetRolePermissionsOutputDto({
      permissions: permissionInfos,
    });
  }
}
