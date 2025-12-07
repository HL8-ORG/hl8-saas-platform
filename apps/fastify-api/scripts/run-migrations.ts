import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';

config();

/**
 * 运行数据库迁移脚本
 *
 * 执行所有待处理的数据库迁移。
 *
 * @function runMigrations
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log('正在初始化数据源...');
    await AppDataSource.initialize();

    console.log('正在运行数据库迁移...');
    const migrations = await AppDataSource.runMigrations();

    if (migrations.length === 0) {
      console.log('没有待处理的迁移。');
    } else {
      console.log(`成功运行 ${migrations.length} 个迁移：`);
      migrations.forEach((migration) => {
        console.log(`  - ${migration.name}`);
      });
    }

    await AppDataSource.destroy();
    console.log('迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('迁移失败：', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

runMigrations();
