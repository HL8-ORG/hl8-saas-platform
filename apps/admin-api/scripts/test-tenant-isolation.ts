import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';
import { Tenant } from '../src/entities/tenant.entity';
import { User } from '../src/entities/user.entity';

config();

/**
 * 测试多租户数据隔离脚本
 *
 * 验证多租户数据隔离功能是否正常工作。
 *
 * @function testTenantIsolation
 * @returns {Promise<void>}
 */
async function testTenantIsolation() {
  try {
    console.log('正在初始化数据源...');
    await AppDataSource.initialize();

    const tenantRepository = AppDataSource.getRepository(Tenant);
    const userRepository = AppDataSource.getRepository(User);

    // 1. 检查租户数量
    const tenants = await tenantRepository.find();
    console.log(`\n系统中共有 ${tenants.length} 个租户：`);
    tenants.forEach((tenant) => {
      console.log(
        `  - ${tenant.name} (ID: ${tenant.id}, 域名: ${tenant.domain || '无'})`,
      );
    });

    if (tenants.length === 0) {
      console.log('\n警告：系统中没有租户，请先创建租户。');
      await AppDataSource.destroy();
      process.exit(1);
    }

    // 2. 检查每个租户的用户数量
    console.log('\n各租户的用户统计：');
    for (const tenant of tenants) {
      const userCount = await userRepository.count({
        where: { tenantId: tenant.id },
      });
      console.log(`  - ${tenant.name}: ${userCount} 个用户`);

      if (userCount > 0) {
        const users = await userRepository.find({
          where: { tenantId: tenant.id },
          select: ['id', 'email', 'tenantId'],
        });
        users.forEach((user) => {
          console.log(`    * ${user.email} (ID: ${user.id})`);
        });
      }
    }

    // 3. 检查是否有未分配租户的用户
    const usersWithoutTenant = await userRepository.count({
      where: { tenantId: null as any },
    });
    if (usersWithoutTenant > 0) {
      console.log(`\n警告：发现 ${usersWithoutTenant} 个未分配租户的用户。`);
      const users = await userRepository.find({
        where: { tenantId: null as any },
        select: ['id', 'email'],
      });
      users.forEach((user) => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    } else {
      console.log('\n✓ 所有用户都已分配租户。');
    }

    // 4. 验证数据隔离
    if (tenants.length >= 2) {
      console.log('\n验证数据隔离：');
      const tenant1 = tenants[0];
      const tenant2 = tenants[1];

      const tenant1Users = await userRepository.find({
        where: { tenantId: tenant1.id },
        select: ['id', 'email'],
      });

      const tenant2Users = await userRepository.find({
        where: { tenantId: tenant2.id },
        select: ['id', 'email'],
      });

      // 检查是否有用户 ID 重叠
      const tenant1UserIds = new Set(tenant1Users.map((u) => u.id));
      const tenant2UserIds = new Set(tenant2Users.map((u) => u.id));
      const overlap = [...tenant1UserIds].filter((id) =>
        tenant2UserIds.has(id),
      );

      if (overlap.length > 0) {
        console.log(
          `  ✗ 发现数据隔离问题：租户 ${tenant1.name} 和 ${tenant2.name} 有重叠的用户 ID。`,
        );
      } else {
        console.log(
          `  ✓ 租户 ${tenant1.name} 和 ${tenant2.name} 的数据已正确隔离。`,
        );
      }
    }

    await AppDataSource.destroy();
    console.log('\n多租户数据隔离测试完成！');
    process.exit(0);
  } catch (error) {
    console.error('测试失败：', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

testTenantIsolation();
