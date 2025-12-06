import { DataSource } from 'typeorm';

/**
 * 数据库连接辅助工具
 *
 * 提供数据库连接检查和测试辅助功能。
 *
 * @class DatabaseHelper
 */
export class DatabaseHelper {
  /**
   * 检查数据库连接
   *
   * 尝试连接数据库，验证连接是否可用。
   *
   * @param {DataSource} dataSource - TypeORM 数据源
   * @returns {Promise<boolean>} 如果连接成功返回 true，否则返回 false
   */
  static async checkConnection(dataSource: DataSource): Promise<boolean> {
    try {
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }
      await dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      console.warn('数据库连接检查失败:', (error as Error).message);
      return false;
    }
  }

  /**
   * 等待数据库连接
   *
   * 等待数据库连接可用，最多重试指定次数。
   *
   * @param {DataSource} dataSource - TypeORM 数据源
   * @param {number} [maxRetries=5] - 最大重试次数
   * @param {number} [retryDelay=1000] - 重试延迟（毫秒）
   * @returns {Promise<boolean>} 如果连接成功返回 true，否则返回 false
   */
  static async waitForConnection(
    dataSource: DataSource,
    maxRetries: number = 5,
    retryDelay: number = 1000,
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.checkConnection(dataSource)) {
        return true;
      }
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  }

  /**
   * 跳过测试（如果数据库不可用）
   *
   * 检查数据库连接，如果不可用则跳过测试。
   *
   * @param {DataSource} dataSource - TypeORM 数据源
   * @param {jest.It} testFn - Jest 测试函数
   * @param {string} testName - 测试名称
   * @param {() => Promise<void>} testImplementation - 测试实现
   */
  static async skipIfNoDatabase(
    dataSource: DataSource,
    testFn: jest.It,
    testName: string,
    testImplementation: () => Promise<void>,
  ): Promise<void> {
    const isConnected = await this.checkConnection(dataSource);
    if (!isConnected) {
      testFn.skip(testName, testImplementation);
      return;
    }
    await testImplementation();
  }
}
