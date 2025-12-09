import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../infrastructure/persistence/typeorm/entities/refresh-token.entity';
import {
  User,
  UserRole,
} from '../infrastructure/persistence/typeorm/entities/user.entity';

dotenv.config();

/**
 * 数据库种子数据源
 *
 * 用于数据库种子脚本的 TypeORM 数据源配置。
 *
 * @constant {DataSource} dataSource
 */
const dataSource = new DataSource({
  type: (process.env.DB_TYPE as any) || 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, RefreshToken],
  synchronize: false,
});

/**
 * 数据库种子函数
 *
 * 初始化数据库并创建测试用户（管理员和普通用户）。
 *
 * **创建的用户**：
 * - 管理员用户：admin@example.com / Admin@123
 * - 普通用户：user@example.com / User@123
 *
 * **业务规则**：
 * - 如果用户已存在，则跳过创建
 * - 密码使用 bcrypt 哈希（盐值 12 轮）
 *
 * @function seed
 * @returns {Promise<void>}
 */
async function seed() {
  console.log('🌱 Seeding database...');

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@123', 12);

  // Create admin user
  let admin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (!admin) {
    admin = userRepository.create({
      email: 'admin@example.com',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);
  }

  // Create regular user
  let user = await userRepository.findOne({
    where: { email: 'user@example.com' },
  });

  if (!user) {
    user = userRepository.create({
      email: 'user@example.com',
      passwordHash: userPassword,
      fullName: 'Regular User',
      role: UserRole.USER,
      isActive: true,
    });
    await userRepository.save(user);
  }

  console.log('✅ Seeding completed');
  console.log('\n📋 Test Credentials:');
  console.log('===================');
  console.log('Admin User:');
  console.log('  Email:', admin.email);
  console.log('  Password: Admin@123');
  console.log('  Role:', admin.role);
  console.log('\nRegular User:');
  console.log('  Email:', user.email);
  console.log('  Password: User@123');
  console.log('  Role:', user.role);

  await dataSource.destroy();
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
