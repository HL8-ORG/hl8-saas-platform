/**
 * 密码哈希服务接口
 *
 * 定义密码哈希和验证的服务接口，用于解耦应用层和基础设施层。
 *
 * @interface IPasswordHasher
 * @description 密码哈希服务接口
 */
export interface IPasswordHasher {
  /**
   * 哈希密码
   *
   * 将明文密码转换为哈希值。
   *
   * @param {string} password - 明文密码
   * @returns {Promise<string>} 密码哈希值
   */
  hash(password: string): Promise<string>;

  /**
   * 验证密码
   *
   * 比较明文密码和哈希值是否匹配。
   *
   * @param {string} password - 明文密码
   * @param {string} hash - 密码哈希值
   * @returns {Promise<boolean>} 如果密码匹配返回 true，否则返回 false
   */
  verify(password: string, hash: string): Promise<boolean>;
}
