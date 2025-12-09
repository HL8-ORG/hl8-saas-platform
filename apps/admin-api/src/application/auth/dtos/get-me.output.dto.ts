/**
 * 获取当前用户输出DTO
 *
 * 获取当前用户用例的输出结果。
 *
 * @class GetMeOutputDto
 * @description 获取当前用户用例输出DTO
 */
export class GetMeOutputDto {
  /**
   * 用户ID
   *
   * @type {string}
   */
  id: string;

  /**
   * 用户邮箱地址
   *
   * @type {string}
   */
  email: string;

  /**
   * 用户全名
   *
   * @type {string}
   */
  fullName: string;

  /**
   * 用户角色
   *
   * @type {string}
   */
  role: string;
}
