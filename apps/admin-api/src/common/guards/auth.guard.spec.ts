import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyRequest } from 'fastify';
import { COOKIE_CONFIG } from '../constants/cookie.config';
import { AuthGuard } from './auth.guard';

/**
 * 认证守卫单元测试
 *
 * 测试 JWT 认证守卫的令牌验证逻辑。
 *
 * @describe AuthGuard
 */
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let reflector: jest.Mocked<Reflector>;

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
      get: jest.fn().mockReturnValue('jwt-secret'),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: FastifyRequest & {
      cookies?: Record<string, string>;
      user?: unknown;
    };

    beforeEach(() => {
      mockRequest = {
        headers: {},
        ip: '127.0.0.1',
        cookies: {},
      } as unknown as FastifyRequest & {
        cookies?: Record<string, string>;
        user?: unknown;
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('当路由标记为公共访问时应该允许通过', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('应该从 Cookie 中提取访问令牌', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.cookies = {
        [COOKIE_CONFIG.ACCESS_TOKEN.name]: 'access-token',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token', {
        secret: 'jwt-secret',
      });
      expect(mockRequest.user).toEqual(mockPayload);
    });

    it('应该从 Authorization header 中提取 Bearer token', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.cookies = {};
      mockRequest.headers = {
        authorization: 'Bearer bearer-token',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('bearer-token', {
        secret: 'jwt-secret',
      });
    });

    it('当令牌缺失时应该抛出 UnauthorizedException', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.cookies = {};
      mockRequest.headers = {};

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('当令牌无效时应该抛出 UnauthorizedException', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.cookies = {
        [COOKIE_CONFIG.ACCESS_TOKEN.name]: 'invalid-token',
      };
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('应该从 raw.headers.cookie 中解析 Cookie', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.cookies = undefined;
      mockRequest.raw = {
        headers: {
          cookie: `${COOKIE_CONFIG.ACCESS_TOKEN.name}=raw-cookie-token`,
        },
      } as any;
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('raw-cookie-token', {
        secret: 'jwt-secret',
      });
    });

    it('应该使用配置的 JWT 密钥', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      configService.get.mockReturnValue('custom-secret');
      mockRequest.cookies = {
        [COOKIE_CONFIG.ACCESS_TOKEN.name]: 'access-token',
      };
      jwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(mockExecutionContext);

      expect(configService.get).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('access-token', {
        secret: 'custom-secret',
      });
    });
  });
});
