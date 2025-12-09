import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * 分页参数HTTP DTO
 *
 * 用于分页查询的HTTP请求参数验证。
 *
 * @class PaginationDto
 * @description 分页查询请求的HTTP DTO
 */
export class PaginationDto {
  /**
   * 页码
   *
   * 分页查询的页码，从 1 开始。
   *
   * @type {number}
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * 每页数量
   *
   * 每页返回的数据数量。
   *
   * @type {number}
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
