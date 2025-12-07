import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';
import { RefreshToken } from '../src/entities/refresh-token.entity';
import { Tenant } from '../src/entities/tenant.entity';
import { User } from '../src/entities/user.entity';

config();

/**
 * 为现有用户分配租户脚本
 *
 * 将现有用户的 tenant_id 更新为默认租户 ID。
 *
 * @function assignTenantToExistingUsers
 * @returns {Promise<void>}
 */
async function assignTenantToExistingUsers() {
  try {
    console.log('正在初始化数据源...');
    await AppDataSource.initialize();

    const tenantRepository = AppDataSource.getRepository(Tenant);
    const userRepository = AppDataSource.getRepository(User);

    // 获取默认租户（第一个租户或域名為 'default' 的租户）
    let defaultTenant = await tenantRepository.findOne({
      where: { domain: 'default' },
    });

    if (!defaultTenant) {
      const tenants = await tenantRepository.find();
      if (tenants.length === 0) {
        console.log('错误：系统中没有租户，请先创建租户。');
        await AppDataSource.destroy();
        process.exit(1);
      }
      defaultTenant = tenants[0];
      console.log(
        `未找到域名為 'default' 的租户，使用第一个租户：${defaultTenant.name}`,
      );
    }

    console.log(`使用租户：${defaultTenant.name} (ID: ${defaultTenant.id})`);

    // 查找所有 tenant_id 为 null 的用户
    const usersWithoutTenant = await userRepository.find({
      where: { tenantId: null as any },
    });

    if (usersWithoutTenant.length === 0) {
      console.log('所有用户都已分配租户。');
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log(`发现 ${usersWithoutTenant.length} 个未分配租户的用户：`);
    usersWithoutTenant.forEach((user) => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });

    // 使用原生 SQL 更新用户的 tenant_id（因为 TypeORM 的 update 方法在处理 null 时可能有问题）
    const updateResult = await userRepository
      .createQueryBuilder()
      .update(User)
      .set({ tenantId: defaultTenant.id })
      .where('tenant_id IS NULL')
      .execute();

    console.log(`\n成功为 ${updateResult.affected} 个用户分配租户。`);

    // 验证更新结果
    const remainingUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.tenant_id IS NULL')
      .getCount();

    if (remainingUsers > 0) {
      console.log(`警告：仍有 ${remainingUsers} 个用户未分配租户。`);
    } else {
      console.log('✓ 所有用户都已成功分配租户。');
    }

    // 为 refresh_tokens 表中的记录分配租户（通过关联的用户获取租户 ID）
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const refreshTokensWithoutTenant = await refreshTokenRepository
      .createQueryBuilder('refreshToken')
      .leftJoinAndSelect('refreshToken.user', 'user')
      .where('refreshToken.tenant_id IS NULL')
      .getMany();

    if (refreshTokensWithoutTenant.length > 0) {
      console.log(
        `\n发现 ${refreshTokensWithoutTenant.length} 个未分配租户的刷新令牌。`,
      );

      // 通过关联的用户获取租户 ID 并更新
      let updatedCount = 0;
      for (const refreshToken of refreshTokensWithoutTenant) {
        if (refreshToken.user && refreshToken.user.tenantId) {
          await refreshTokenRepository
            .createQueryBuilder()
            .update(RefreshToken)
            .set({ tenantId: refreshToken.user.tenantId })
            .where('id = :id', { id: refreshToken.id })
            .execute();
          updatedCount++;
        } else {
          // 如果用户没有租户，使用默认租户
          await refreshTokenRepository
            .createQueryBuilder()
            .update(RefreshToken)
            .set({ tenantId: defaultTenant.id })
            .where('id = :id', { id: refreshToken.id })
            .execute();
          updatedCount++;
        }
      }

      console.log(`成功为 ${updatedCount} 个刷新令牌分配租户。`);

      // 验证更新结果
      const remainingTokens = await refreshTokenRepository
        .createQueryBuilder('refreshToken')
        .where('refreshToken.tenant_id IS NULL')
        .getCount();

      if (remainingTokens > 0) {
        console.log(`警告：仍有 ${remainingTokens} 个刷新令牌未分配租户。`);
      } else {
        console.log('✓ 所有刷新令牌都已成功分配租户。');
      }
    } else {
      console.log('\n所有刷新令牌都已分配租户。');
    }

    await AppDataSource.destroy();
    console.log('\n用户租户分配完成！');
    process.exit(0);
  } catch (error) {
    console.error('分配租户失败：', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

assignTenantToExistingUsers();
