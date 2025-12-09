import { CreateRoleInputDto } from '../../application/roles/dtos/create-role.input.dto';
import { DeleteRoleInputDto } from '../../application/roles/dtos/delete-role.input.dto';
import { GetRoleByIdInputDto } from '../../application/roles/dtos/get-role-by-id.input.dto';
import { GetRolePermissionsInputDto } from '../../application/roles/dtos/get-role-permissions.input.dto';
import { GetRolesInputDto } from '../../application/roles/dtos/get-roles.input.dto';
import { GrantRolePermissionInputDto } from '../../application/roles/dtos/grant-role-permission.input.dto';
import type { ITenantResolver } from '../../application/shared/interfaces/tenant-resolver.interface';
import { AddRolePermissionDto as HttpAddRolePermissionDto } from '../dtos/roles/add-role-permission.dto';
import { CreateRoleDto as HttpCreateRoleDto } from '../dtos/roles/create-role.dto';

/**
 * 角色HTTP DTO映射器
 *
 * 负责HTTP层的DTO和应用层用例DTO之间的映射转换。
 * 处理HTTP请求到用例输入参数的转换。
 *
 * @class RolesMapper
 * @description HTTP DTO ↔ 用例DTO映射器
 */
export class RolesMapper {
  /**
   * 将HTTP创建角色DTO转换为用例输入DTO
   *
   * @param {HttpCreateRoleDto} httpDto - HTTP创建角色DTO
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<CreateRoleInputDto>} 用例输入DTO
   */
  static async toCreateRoleInput(
    httpDto: HttpCreateRoleDto,
    tenantResolver: ITenantResolver,
  ): Promise<CreateRoleInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new CreateRoleInputDto({
      tenantId,
      name: httpDto.name,
      displayName: httpDto.displayName,
      description: httpDto.description,
    });
  }

  /**
   * 转换为获取角色列表用例输入DTO
   *
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<GetRolesInputDto>} 用例输入DTO
   */
  static async toGetRolesInput(
    tenantResolver: ITenantResolver,
  ): Promise<GetRolesInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GetRolesInputDto({ tenantId });
  }

  /**
   * 将角色ID转换为根据ID获取角色用例输入DTO
   *
   * @param {string} roleId - 角色ID
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<GetRoleByIdInputDto>} 用例输入DTO
   */
  static async toGetRoleByIdInput(
    roleId: string,
    tenantResolver: ITenantResolver,
  ): Promise<GetRoleByIdInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GetRoleByIdInputDto({ roleId, tenantId });
  }

  /**
   * 将角色ID转换为删除角色用例输入DTO
   *
   * @param {string} roleId - 角色ID
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<DeleteRoleInputDto>} 用例输入DTO
   */
  static async toDeleteRoleInput(
    roleId: string,
    tenantResolver: ITenantResolver,
  ): Promise<DeleteRoleInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new DeleteRoleInputDto({ roleId, tenantId });
  }

  /**
   * 将HTTP添加角色权限DTO转换为用例输入DTO
   *
   * @param {string} roleId - 角色ID
   * @param {HttpAddRolePermissionDto} httpDto - HTTP添加角色权限DTO
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @returns {Promise<GrantRolePermissionInputDto>} 用例输入DTO
   */
  static async toGrantRolePermissionInput(
    roleId: string,
    httpDto: HttpAddRolePermissionDto,
    tenantResolver: ITenantResolver,
  ): Promise<GrantRolePermissionInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GrantRolePermissionInputDto({
      roleId,
      tenantId,
      resource: httpDto.resource,
      action: httpDto.operation,
      description: httpDto.description,
    });
  }

  /**
   * 将角色ID转换为获取角色权限用例输入DTO
   *
   * @param {string} roleId - 角色ID
   * @param {ITenantResolver} tenantResolver - 租户解析器
   * @param {boolean} [withDetails=false] - 是否包含详细信息
   * @returns {Promise<GetRolePermissionsInputDto>} 用例输入DTO
   */
  static async toGetRolePermissionsInput(
    roleId: string,
    tenantResolver: ITenantResolver,
    withDetails: boolean = false,
  ): Promise<GetRolePermissionsInputDto> {
    const tenantId = tenantResolver.getCurrentTenantId();
    return new GetRolePermissionsInputDto({
      roleId,
      tenantId,
      withDetails,
    });
  }
}
