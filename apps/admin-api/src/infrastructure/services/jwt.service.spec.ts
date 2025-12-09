import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthJwtService } from './jwt.service';

/**
 * JWT 服务单元测试
 *
 * 测试 JWT 服务的令牌生成功能。
 *
 * @describe AuthJwtService
 */
describe('AuthJwtService', () => {
  let service: AuthJwtService;
  let nestJwtService: jest.Mocked<NestJwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockNestJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthJwtService,
        {
          provide: NestJwtService,
          useValue: mockNestJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthJwtService>(AuthJwtService);
    nestJwtService = module.get(NestJwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('signAccessToken', () => {
    const payload = {
      sub: 'user123',
      role: 'USER',
      email: 'test@example.com',
      tenantId: 'tenant123',
    };

    it('应该生成访问令牌', async () => {
      const mockToken = 'mock-access-token';
      const mockSecret = 'access-secret';
      const mockExpiry = '15m';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return mockSecret;
        if (key === 'JWT_ACCESS_EXPIRY') return mockExpiry;
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signAccessToken(payload);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: mockExpiry,
      });
    });

    it('应该使用默认过期时间当配置不存在时', async () => {
      const mockToken = 'mock-access-token';
      const mockSecret = 'access-secret';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return mockSecret;
        if (key === 'JWT_ACCESS_EXPIRY') return undefined;
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signAccessToken(payload);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: '15m',
      });
    });

    it('应该处理没有 tenantId 的载荷', async () => {
      const payloadWithoutTenant = {
        sub: 'user123',
        role: 'USER',
        email: 'test@example.com',
      };
      const mockToken = 'mock-access-token';
      const mockSecret = 'access-secret';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return mockSecret;
        if (key === 'JWT_ACCESS_EXPIRY') return '15m';
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signAccessToken(payloadWithoutTenant);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(
        payloadWithoutTenant,
        {
          secret: mockSecret,
          expiresIn: '15m',
        },
      );
    });
  });

  describe('signRefreshToken', () => {
    const payload = {
      sub: 'user123',
      role: 'USER',
      email: 'test@example.com',
      tenantId: 'tenant123',
    };

    it('应该生成刷新令牌', async () => {
      const mockToken = 'mock-refresh-token';
      const mockSecret = 'refresh-secret';
      const mockExpiry = '7d';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return mockSecret;
        if (key === 'JWT_REFRESH_EXPIRY') return mockExpiry;
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signRefreshToken(payload);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: mockExpiry,
      });
    });

    it('应该使用默认过期时间当配置不存在时', async () => {
      const mockToken = 'mock-refresh-token';
      const mockSecret = 'refresh-secret';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return mockSecret;
        if (key === 'JWT_REFRESH_EXPIRY') return undefined;
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signRefreshToken(payload);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: '7d',
      });
    });

    it('应该处理不同的载荷', async () => {
      const differentPayload = {
        sub: 'user456',
        role: 'ADMIN',
        email: 'admin@example.com',
        tenantId: 'tenant456',
      };
      const mockToken = 'mock-refresh-token';
      const mockSecret = 'refresh-secret';

      configService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return mockSecret;
        if (key === 'JWT_REFRESH_EXPIRY') return '7d';
        return undefined;
      });

      nestJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signRefreshToken(differentPayload);

      expect(result).toBe(mockToken);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(differentPayload, {
        secret: mockSecret,
        expiresIn: '7d',
      });
    });
  });
});
