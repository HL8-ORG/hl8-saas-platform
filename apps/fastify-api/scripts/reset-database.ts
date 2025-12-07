import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';

config();

/**
 * 重置数据库脚本
 *
 * 删除所有表并重新运行迁移，创建干净的数据库结构。
 * **警告**：此操作会删除所有数据，请谨慎使用！
 *
 * @function resetDatabase
 * @returns {Promise<void>}
 */
async function resetDatabase() {
  try {
    console.log('正在初始化数据源...');
    await AppDataSource.initialize();

    console.log('正在删除所有表...');
    // 获取所有表名
    const queryRunner = AppDataSource.createQueryRunner();

    // 禁用外键检查（PostgreSQL 使用不同的语法）
    await queryRunner.query('SET session_replication_role = replica;');

    // 获取所有表名
    const tables = await queryRunner.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    // 删除所有表
    for (const table of tables) {
      const tableName = table.tablename;
      if (tableName !== 'spatial_ref_sys') {
        // 保留 PostGIS 系统表
        console.log(`  删除表: ${tableName}`);
        await queryRunner.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      }
    }

    // 恢复外键检查
    await queryRunner.query('SET session_replication_role = DEFAULT;');

    await queryRunner.release();

    console.log('所有表已删除。');
    console.log('\n正在运行数据库迁移...');

    // 重新运行所有迁移
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
    console.log('\n数据库重置完成！');
    console.log('现在可以运行 pnpm tenant:create 创建初始租户。');
    process.exit(0);
  } catch (error) {
    console.error('重置数据库失败：', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

resetDatabase();
