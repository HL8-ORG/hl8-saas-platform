import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * 更新租户 HTTP DTO
 *
 * 用于更新租户信息的HTTP请求数据传输对象。
 * 所有字段都是可选的。
 *
 * @class UpdateTenantDto
 * @description 更新租户的HTTP请求DTO
 */
export class UpdateTenantDto {
  /**
   * 租户名称
   *
   * 租户的显示名称，必须唯一。
   * 长度限制：1-100 个字符。
   *
   * @type {string | undefined}
   */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  /**
   * 租户域名
   *
   * 租户的子域名，用于基于域名的租户识别（可选）。
   * 例如：'acme' 对应 'acme.example.com'
   * 必须符合域名格式：字母、数字、连字符，不能以连字符开头或结尾。
   *
   * @type {string | null | undefined}
   */
  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, {
    message:
      '域名格式无效，只能包含字母、数字和连字符，且不能以连字符开头或结尾',
  })
  domain?: string | null;

  /**
   * 是否激活
   *
   * 标识租户是否处于激活状态。
   * 非激活的租户无法访问系统。
   *
   * @type {boolean | undefined}
   */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
