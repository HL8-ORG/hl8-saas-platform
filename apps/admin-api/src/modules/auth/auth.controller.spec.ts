import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { COOKIE_CONFIG } from '../../common/constants/cookie.config';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { SignupDto } from './dtos/signup.dto';

/**
 * 认证控制器单元测试
 *
 * 测试认证控制器的 HTTP 请求处理逻辑。
 *
 * @describe AuthController
 */
describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'USER',
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const mockAuthService = {
      signup: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      getMe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RefreshTokenGuard,
          useValue: {
            canActivate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(RefreshTokenGuard)
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
    };

    it('应该成功注册用户', async () => {
      authService.signup.mockResolvedValue({
        user: mockUser,
        message: 'User registered successfully',
      });

      const result = await controller.signup(signupDto);

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('message', 'User registered successfully');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('应该成功登录并设置 Cookie', async () => {
      const mockRequest = {
        headers: {
          'user-agent': 'Test Device',
          'x-forwarded-for': '127.0.0.1',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const mockReply = {
        setCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      authService.login.mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const result = await controller.login(loginDto, mockRequest, mockReply);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        'Test Device',
        '127.0.0.1',
      );
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.ACCESS_TOKEN.name,
        mockTokens.accessToken,
        COOKIE_CONFIG.ACCESS_TOKEN.options,
      );
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.REFRESH_TOKEN.name,
        mockTokens.refreshToken,
        COOKIE_CONFIG.REFRESH_TOKEN.options,
      );
      expect(result).toHaveProperty('user', mockUser);
      expect(result).toHaveProperty('accessToken', mockTokens.accessToken);
      expect(result).toHaveProperty('refreshToken', mockTokens.refreshToken);
    });

    it('应该处理缺失的设备信息', async () => {
      const mockRequest = {
        headers: {},
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const mockReply = {
        setCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      authService.login.mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      await controller.login(loginDto, mockRequest, mockReply);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto,
        'Unknown Device',
        '127.0.0.1',
      );
    });
  });

  describe('refreshToken', () => {
    const userId = 'user-1';
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('应该成功刷新令牌并设置 Cookie', async () => {
      const mockRequest = {
        cookies: {
          [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'refresh-token',
        },
        headers: {
          'user-agent': 'Test Device',
          'x-forwarded-for': '127.0.0.1',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const mockReply = {
        setCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      authService.refreshToken.mockResolvedValue(newTokens);

      const result = await controller.refreshToken(
        userId,
        mockRequest,
        mockReply,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith(
        userId,
        'refresh-token',
        'Test Device',
        '127.0.0.1',
      );
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.ACCESS_TOKEN.name,
        newTokens.accessToken,
        COOKIE_CONFIG.ACCESS_TOKEN.options,
      );
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.REFRESH_TOKEN.name,
        newTokens.refreshToken,
        COOKIE_CONFIG.REFRESH_TOKEN.options,
      );
      expect(result).toHaveProperty('message', 'Tokens refreshed successfully');
    });
  });

  describe('logout', () => {
    const userId = 'user-1';

    it('应该成功登出并清除 Cookie（单设备）', async () => {
      const mockRequest = {
        cookies: {
          [COOKIE_CONFIG.REFRESH_TOKEN.name]: 'refresh-token',
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        clearCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      authService.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const result = await controller.logout(userId, mockRequest, mockReply);

      expect(authService.logout).toHaveBeenCalledWith(userId, 'refresh-token');
      expect(mockReply.clearCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.ACCESS_TOKEN.name,
        COOKIE_CONFIG.ACCESS_TOKEN.options,
      );
      expect(mockReply.clearCookie).toHaveBeenCalledWith(
        COOKIE_CONFIG.REFRESH_TOKEN.name,
        COOKIE_CONFIG.REFRESH_TOKEN.options,
      );
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });

    it('应该成功登出并清除 Cookie（全设备）', async () => {
      const mockRequest = {
        cookies: {},
      } as unknown as FastifyRequest;

      const mockReply = {
        clearCookie: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      authService.logout.mockResolvedValue({
        message: 'Logged out successfully',
      });

      const result = await controller.logout(userId, mockRequest, mockReply);

      expect(authService.logout).toHaveBeenCalledWith(userId, undefined);
      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('getMe', () => {
    const userId = 'user-1';

    it('应该返回当前用户信息', async () => {
      authService.getMe.mockResolvedValue(mockUser);

      const result = await controller.getMe(userId);

      expect(authService.getMe).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });
});
