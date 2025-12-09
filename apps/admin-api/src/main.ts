import fastifyCookie from '@fastify/cookie';
import { Logger } from '@hl8/logger';
import { RedisUtility } from '@hl8/redis';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * 应用启动函数
 *
 * 初始化并配置 NestJS 应用，包括：
 * - Pino 日志系统
 * - CORS 配置
 * - Fastify Cookie 插件注册
 * - Helmet 安全头配置
 * - 全局验证管道
 * - 全局响应拦截器
 * - 全局异常过滤器
 *
 * **安全配置**：
 * - Helmet: 配置严格的安全头，包括 CSP、HSTS、XSS 防护等
 * - CORS: 支持跨域请求，允许携带凭证
 * - Cookie: 注册 @fastify/cookie 插件（用于 JWT Token 的 Cookie 操作）
 *
 * **全局配置**：
 * - ValidationPipe: 自动验证和转换请求数据，启用白名单过滤
 * - ResponseInterceptor: 统一 API 响应格式
 * - HttpExceptionFilter: 统一异常响应格式
 *
 * @function bootstrap
 * @returns {Promise<void>}
 */
async function bootstrap() {
  // 初始化 Redis 连接（在创建应用之前）
  try {
    await RedisUtility.client();
    console.log('✅ Redis 连接已初始化');
  } catch (error) {
    console.error('❌ Redis 初始化失败:', error);
    // 根据业务需求决定是否继续启动
    // 如果 Redis 是必需的，可以取消注释下一行来阻止启动
    // throw error;
  }

  // Create Fastify adapter and register cookie plugin before creating the app
  const adapter = new FastifyAdapter();

  // Register cookie plugin on the adapter's Fastify instance
  await adapter.getInstance().register(fastifyCookie);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT');
  const corsOrigins = configService.get<string>('CORS_ORIGIN')?.split(',');

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Configure Helmet with strict security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response interceptor for standard API responses
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global exception filter for standard error responses
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  const options = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API docs')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port || 9528);

  logger.log(
    `🚀 Application is running on: http://localhost:${port || 9528}/api/v1`,
    'Bootstrap',
  );
}

/**
 * 应用关闭处理
 *
 * 清理 Redis 连接等资源。
 *
 * @function shutdown
 * @returns {Promise<void>}
 */
async function shutdown() {
  try {
    await RedisUtility.close();
    console.log('✅ Redis 连接已关闭');
  } catch (error) {
    console.error('❌ 关闭 Redis 连接失败:', error);
  }
}

// 在应用关闭时清理 Redis 连接
process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

void bootstrap();
