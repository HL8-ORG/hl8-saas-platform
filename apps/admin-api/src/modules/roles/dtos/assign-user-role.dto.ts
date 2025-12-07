import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 分配用户角色 DTO
 *
 * 用于为用户分配角色的请求数据验证。
 *
 * @class AssignUserRoleDto
 * @description 分配用户角色请求的 DTO
 */
export class AssignUserRoleDto {
  /**
   * 角色名称
   *
   * 要分配给用户的角色名称。
   *
   * @type {string}
   */
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MinLength(2, { message: '角色名称至少为 2 个字符' })
  @MaxLength(50, { message: '角色名称最多为 50 个字符' })
  roleName: string;
}
