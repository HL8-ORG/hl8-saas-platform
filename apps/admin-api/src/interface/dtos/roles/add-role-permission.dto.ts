import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 添加角色权限 HTTP DTO
 *
 * 用于为角色添加权限的HTTP请求数据传输对象。
 *
 * @class AddRolePermissionDto
 * @description 添加角色权限请求的HTTP DTO
 */
export class AddRolePermissionDto {
  /**
   * 操作类型
   *
   * 权限操作类型，如 'read:any'、'create:any' 等。
   *
   * @type {string}
   */
  @IsString()
  @IsNotEmpty({ message: '操作类型不能为空' })
  operation: string;

  /**
   * 资源标识
   *
   * 权限控制的资源标识，如 'user'、'users_list' 等。
   *
   * @type {string}
   */
  @IsString()
  @IsNotEmpty({ message: '资源标识不能为空' })
  resource: string;

  /**
   * 权限描述
   *
   * 权限的详细描述，说明权限的用途和范围。
   *
   * @type {string | undefined}
   */
  @IsOptional()
  @IsString()
  description?: string;
}
