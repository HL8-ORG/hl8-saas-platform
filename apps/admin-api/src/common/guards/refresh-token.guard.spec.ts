import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { COOKIE_CONFIG } from '../constants/cookie.config';
import { RefreshTokenGuard } from './refresh-token.guard';

/**
 * 刷新令牌守卫单元测试
 *
 * 测试刷新令牌守卫的令牌验证逻辑。
 *
 * @describe RefreshTokenGuard
 */
describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload = {
    sub: 'user-1',
    role: 'USER',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('refresh-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: {
      cookies: Record<string, string>;
      user?: unknown;
    };

    beforeEach(() => {
      mockRequest = {
        cookies: {},
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;
    });

    it('应该从 Cookie 中提取刷新令牌并验证', async () => {
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'refresh-token',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'refresh-secret',
      });
      expect(mockRequest.user).toEqual(mockPayload);
    });

    it('当刷新令牌缺失时应该抛出 UnauthorizedException', async () => {
      mockRequest.cookies = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('当刷新令牌格式错误时应该抛出 UnauthorizedException', async () => {
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: null as any,
      };

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当刷新令牌无效时应该抛出 UnauthorizedException', async () => {
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'invalid-token',
      };
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当刷新令牌过期时应该抛出 UnauthorizedException', async () => {
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'expired-token',
      };
      jwtService.verifyAsync.mockRejectedValue(new Error('Token expired'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该使用配置的刷新令牌密钥', async () => {
      configService.get.mockReturnValue('custom-refresh-secret');
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'refresh-token',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(mockExecutionContext);

      expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
        secret: 'custom-refresh-secret',
      });
    });

    it('应该将验证后的载荷附加到请求对象', async () => {
      const customPayload = {
        sub: 'user-2',
        role: 'ADMIN',
        email: 'admin@example.com',
      };
      mockRequest.cookies = {
        [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'refresh-token',
      };
      jwtService.verifyAsync.mockResolvedValue(customPayload);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toEqual(customPayload);
    });
  });
});
