import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 创建角色 HTTP DTO
 *
 * 用于创建新角色的HTTP请求数据传输对象。
 *
 * @class CreateRoleDto
 * @description 创建角色的HTTP请求DTO
 */
export class CreateRoleDto {
  /**
   * 角色名称
   *
   * 角色的唯一标识名称，用于 Casbin 策略中的角色定义。
   * 必须是 2-50 个字符。
   *
   * @type {string}
   */
  @IsString()
  @MinLength(2, { message: '角色名称至少为 2 个字符' })
  @MaxLength(50, { message: '角色名称最多为 50 个字符' })
  name: string;

  /**
   * 角色显示名称
   *
   * 角色的友好显示名称，用于用户界面展示。
   * 可选，如果不提供则使用 name。
   *
   * @type {string | undefined}
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '显示名称最多为 100 个字符' })
  displayName?: string;

  /**
   * 角色描述
   *
   * 角色的详细描述，说明角色的用途和权限范围。
   *
   * @type {string | undefined}
   */
  @IsOptional()
  @IsString()
  description?: string;
}
