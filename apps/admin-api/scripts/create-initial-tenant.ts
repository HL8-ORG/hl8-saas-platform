import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';
import { Tenant } from '../src/infrastructure/persistence/typeorm/entities/tenant.entity';

config();

/**
 * 创建初始租户脚本
 *
 * 创建第一个租户，用于系统初始化。
 *
 * @function createInitialTenant
 * @returns {Promise<void>}
 */
async function createInitialTenant() {
  try {
    console.log('正在初始化数据源...');
    await AppDataSource.initialize();

    const tenantRepository = AppDataSource.getRepository(Tenant);

    // 检查是否已存在租户
    const existingTenants = await tenantRepository.find();
    if (existingTenants.length > 0) {
      console.log('系统中已存在租户：');
      existingTenants.forEach((tenant) => {
        console.log(`  - ${tenant.name} (ID: ${tenant.id})`);
      });
      console.log('跳过创建初始租户。');
      await AppDataSource.destroy();
      process.exit(0);
    }

    // 创建默认租户
    const defaultTenant = tenantRepository.create({
      name: '默认租户',
      domain: 'default',
      isActive: true,
    });

    const savedTenant = await tenantRepository.save(defaultTenant);
    console.log('成功创建初始租户：');
    console.log(`  - 名称: ${savedTenant.name}`);
    console.log(`  - 域名: ${savedTenant.domain}`);
    console.log(`  - ID: ${savedTenant.id}`);
    console.log(`  - 激活状态: ${savedTenant.isActive ? '是' : '否'}`);

    await AppDataSource.destroy();
    console.log('初始租户创建完成！');
    process.exit(0);
  } catch (error) {
    console.error('创建初始租户失败：', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createInitialTenant();
