import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { LoginCommand } from '../../../application/auth/commands/login.command';
import { LogoutCommand } from '../../../application/auth/commands/logout.command';
import { RefreshTokenCommand } from '../../../application/auth/commands/refresh-token.command';
import { ResendVerificationCommand } from '../../../application/auth/commands/resend-verification.command';
import { SignupCommand } from '../../../application/auth/commands/signup.command';
import { VerifyEmailCommand } from '../../../application/auth/commands/verify-email.command';
import { GetMeQuery } from '../../../application/auth/queries/get-me.query';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';
import { LoginDto } from '../../dtos/auth/login.dto';
import { SignupDto } from '../../dtos/auth/signup.dto';
import { VerifyEmailDto } from '../../dtos/auth/verify-email.dto';
import { AuthMapper } from '../../mappers/auth.mapper';
import { AuthController } from './auth.controller';

// Mock AuthMapper
jest.mock('../../mappers/auth.mapper', () => ({
  AuthMapper: {
    toSignupCommand: jest.fn(),
  },
}));

/**
 * 认证控制器单元测试
 *
 * 测试认证控制器的所有端点。
 *
 * @describe AuthController
 */
describe('AuthController', () => {
  let controller: AuthController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(RefreshTokenGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      } as any)
      .compile();

    controller = module.get<AuthController>(AuthController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('应该处理用户注册请求', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      const mockCommand = new SignupCommand(
        signupDto.email,
        signupDto.password,
        signupDto.fullName,
        signupDto.tenantName,
      );
      const mockResult = {
        userId: 'user123',
        email: signupDto.email,
        fullName: signupDto.fullName,
        isActive: true,
        isEmailVerified: false,
        message: 'User registered successfully',
      };

      jest.spyOn(AuthMapper, 'toSignupCommand').mockReturnValue(mockCommand);
      commandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.signup(signupDto);

      expect(AuthMapper.toSignupCommand).toHaveBeenCalledWith(signupDto);
      expect(commandBus.execute).toHaveBeenCalledWith(mockCommand);
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('应该处理用户登录请求', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Test Agent',
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        setCookie: jest.fn(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      const mockCommand = new LoginCommand(
        loginDto.email,
        loginDto.password,
        mockRequest.ip,
        mockRequest.headers['user-agent'] || 'unknown',
      );
      const mockResult = {
        user: {
          id: 'user123',
          email: loginDto.email,
          fullName: 'Test User',
          role: 'USER',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      commandBus.execute.mockResolvedValue(mockResult);

      await controller.login(loginDto, mockRequest, mockReply);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(LoginCommand));
      expect(mockReply.setCookie).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        accessToken: mockResult.accessToken,
        user: mockResult.user,
      });
    });
  });

  describe('refreshToken', () => {
    it('应该处理刷新令牌请求', async () => {
      const userId = 'user123';
      const refreshToken = 'refresh-token-value';

      const mockRequest = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Test Agent',
        },
      } as unknown as FastifyRequest;

      const mockReply = {
        setCookie: jest.fn(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      const mockCommand = new RefreshTokenCommand(
        userId,
        refreshToken,
        mockRequest.ip,
        mockRequest.headers['user-agent'] || 'unknown',
      );
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      commandBus.execute.mockResolvedValue(mockResult);

      await controller.refreshToken(
        userId,
        refreshToken,
        mockRequest,
        mockReply,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RefreshTokenCommand),
      );
      expect(mockReply.setCookie).toHaveBeenCalled();
      expect(mockReply.send).toHaveBeenCalledWith({
        accessToken: mockResult.accessToken,
      });
    });
  });

  describe('logout', () => {
    it('应该处理登出请求', async () => {
      const userId = 'user123';
      const mockRequest = {
        cookies: {
          refresh_token: 'refresh-token-value',
        },
      } as unknown as FastifyRequest;
      const mockReply = {
        clearCookie: jest.fn(),
        send: jest.fn(),
      } as unknown as FastifyReply;

      const mockCommand = new LogoutCommand(userId, 'refresh-token-value');
      const mockResult = { message: 'Logged out successfully' };

      commandBus.execute.mockResolvedValue(mockResult);

      await controller.logout(userId, mockRequest, mockReply);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LogoutCommand),
      );
      expect(mockReply.clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/',
      });
      expect(mockReply.send).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('verifyEmail', () => {
    it('应该处理邮箱验证请求', async () => {
      const userId = 'user123';
      const verifyEmailDto: VerifyEmailDto = {
        code: '123456',
      };

      const mockCommand = new VerifyEmailCommand(userId, verifyEmailDto.code);
      const mockResult = { message: 'Email verified successfully' };

      commandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.verifyEmail(userId, verifyEmailDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(VerifyEmailCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('resendVerification', () => {
    it('应该处理重发验证码请求', async () => {
      const userId = 'user123';

      const mockCommand = new ResendVerificationCommand(userId);
      const mockResult = { message: 'Verification code sent' };

      commandBus.execute.mockResolvedValue(mockResult);

      const result = await controller.resendVerification(userId);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ResendVerificationCommand),
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getMe', () => {
    it('应该获取当前用户信息', async () => {
      const userId = 'user123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
      };

      const mockQuery = new GetMeQuery(userId);
      queryBus.execute.mockResolvedValue(mockUser);

      const result = await controller.getMe(userId);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetMeQuery));
      expect(result).toEqual(mockUser);
    });
  });
});
