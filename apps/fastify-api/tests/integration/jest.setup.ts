/**
 * 集成测试全局设置
 *
 * 在运行集成测试之前执行的全局配置。
 * 包括环境变量设置、测试数据库配置等。
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-integration-tests';
process.env.JWT_REFRESH_SECRET =
  'test-refresh-secret-key-for-integration-tests';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '30d';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '0'; // 使用随机端口
// 注意：Throttler 限制在测试中通过覆盖 ThrottlerGuard 来禁用（见 test-app.factory.ts）

// 如果没有设置测试数据库 URL，使用默认值
// 优先使用环境变量，其次使用 Docker Compose 配置，最后使用默认值
if (!process.env.DATABASE_URL && !process.env.TEST_DATABASE_URL) {
  // 尝试使用 Docker Compose 中的数据库配置
  // 如果 Docker Compose 正在运行，使用这些凭据
  const dockerComposeDbUrl =
    'postgresql://aiofix:aiofix@localhost:5432/fastify_api_test';

  // 默认使用标准 PostgreSQL 测试数据库配置
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || dockerComposeDbUrl;
}

// 设置测试数据库类型
if (!process.env.DB_TYPE) {
  process.env.DB_TYPE = 'postgres';
}

// 输出测试配置信息（仅在需要时）
if (process.env.DEBUG_TEST_CONFIG === 'true') {
  console.log('测试数据库配置:', {
    DATABASE_URL: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'),
    DB_TYPE: process.env.DB_TYPE,
    NODE_ENV: process.env.NODE_ENV,
  });
}
