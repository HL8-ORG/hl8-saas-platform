import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 分页数据传输对象
 *
 * 用于分页查询请求的参数验证。
 *
 * @class PaginationDto
 * @description 分页查询参数的 DTO
 */
export class PaginationDto {
  /**
   * 页码
   *
   * 当前请求的页码，从 1 开始。
   * 默认为 1，最小值为 1。
   *
   * @type {number}
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * 每页数据限制
   *
   * 每页返回的数据条数。
   * 默认为 10，最小值为 1，最大值为 100。
   *
   * @type {number}
   * @default 10
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * 分页响应接口
 *
 * 定义分页查询响应的数据结构。
 *
 * @template T - 数据项的类型
 * @interface PaginatedResponse
 */
export interface PaginatedResponse<T> {
  /** 数据列表 */
  data: T[];
  /** 分页元数据 */
  meta: {
    /** 总记录数 */
    total: number;
    /** 当前页码 */
    page: number;
    /** 每页数据限制 */
    limit: number;
    /** 总页数 */
    totalPages: number;
    /** 是否有下一页 */
    hasNext: boolean;
    /** 是否有上一页 */
    hasPrevious: boolean;
  };
}
