import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

/**
 * 健康检查控制器单元测试
 *
 * 测试健康检查控制器的功能。
 *
 * @describe HealthController
 */
describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let typeOrmHealthIndicator: jest.Mocked<TypeOrmHealthIndicator>;

  beforeEach(async () => {
    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
    typeOrmHealthIndicator = module.get(TypeOrmHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('应该执行健康检查', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
      };

      healthCheckService.check.mockImplementation((checks) => {
        // 执行检查函数以触发 pingCheck
        if (Array.isArray(checks) && checks.length > 0) {
          checks.forEach((check: () => Promise<unknown>) => {
            check();
          });
        }
        return Promise.resolve(mockHealthResult as any);
      });

      typeOrmHealthIndicator.pingCheck.mockResolvedValue({
        database: { status: 'up' },
      } as any);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(result).toEqual(mockHealthResult);
    });

    it('应该调用数据库 ping 检查', () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
      };

      healthCheckService.check.mockImplementation((checks) => {
        // 执行检查函数
        if (Array.isArray(checks) && checks.length > 0) {
          checks.forEach((check: () => Promise<unknown>) => {
            check();
          });
        }
        return Promise.resolve(mockHealthResult as any);
      });

      typeOrmHealthIndicator.pingCheck.mockResolvedValue({
        database: { status: 'up' },
      } as any);

      controller.check();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
    });

    it('当数据库健康检查失败时应该返回错误状态', async () => {
      const mockHealthResult = {
        status: 'error',
        error: {
          database: {
            status: 'down',
            message: 'Connection timeout',
          },
        },
      };

      healthCheckService.check.mockImplementation((checks) => {
        if (Array.isArray(checks) && checks.length > 0) {
          checks.forEach((check: () => Promise<unknown>) => {
            check().catch(() => {
              // 忽略错误，由 healthCheckService 处理
            });
          });
        }
        return Promise.resolve(mockHealthResult as any);
      });

      typeOrmHealthIndicator.pingCheck.mockRejectedValue(
        new Error('Connection timeout'),
      );

      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
    });

    it('应该返回健康检查结果', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
            message: 'Database is healthy',
          },
        },
      };

      healthCheckService.check.mockResolvedValue(mockHealthResult as any);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalled();
    });
  });
});
