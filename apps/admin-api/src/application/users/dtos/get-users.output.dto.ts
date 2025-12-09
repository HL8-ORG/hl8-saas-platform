import { GetProfileOutputDto } from './get-profile.output.dto';

/**
 * 获取用户列表输出DTO
 *
 * 返回用户列表和分页元数据。
 *
 * @class GetUsersOutputDto
 * @description 获取用户列表用例的输出DTO
 */
export class GetUsersOutputDto {
  /**
   * 用户列表
   *
   * @type {GetProfileOutputDto[]}
   */
  public readonly data: GetProfileOutputDto[];

  /**
   * 分页元数据
   *
   * @type {Object}
   */
  public readonly meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  /**
   * 构造函数
   *
   * 创建获取用户列表输出DTO实例。
   *
   * @param {object} props - 分页结果属性
   */
  constructor(props: {
    data: GetProfileOutputDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }) {
    this.data = props.data;
    this.meta = props.meta;
  }
}
