import type { FastifyRequest } from 'fastify';
import { SignupCommand } from '../../application/auth/commands/signup.command';
import { LoginDto } from '../dtos/auth/login.dto';
import { ResendVerificationDto } from '../dtos/auth/resend-verification.dto';
import { SignupDto } from '../dtos/auth/signup.dto';
import { VerifyEmailDto } from '../dtos/auth/verify-email.dto';
import { AuthMapper } from './auth.mapper';

/**
 * 认证HTTP DTO映射器单元测试
 *
 * 测试 AuthMapper 的所有静态方法。
 *
 * @describe AuthMapper
 */
describe('AuthMapper', () => {
  describe('toSignupCommand', () => {
    it('应该将HTTP注册DTO转换为注册命令', () => {
      const httpDto: SignupDto = {
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'test-tenant',
      };

      const result = AuthMapper.toSignupCommand(httpDto);

      expect(result).toBeInstanceOf(SignupCommand);
      expect(result.email).toBe(httpDto.email);
      expect(result.password).toBe(httpDto.password);
      expect(result.fullName).toBe(httpDto.fullName);
      expect(result.tenantName).toBe(httpDto.tenantName);
    });
  });

  describe('toSignupInput', () => {
    it('应该将HTTP注册DTO转换为用例输入DTO（无请求对象）', () => {
      const httpDto: SignupDto = {
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'test-tenant',
      };

      const result = AuthMapper.toSignupInput(httpDto);

      expect(result).toMatchObject({
        email: httpDto.email,
        password: httpDto.password,
        fullName: httpDto.fullName,
        tenantId: undefined,
      });
    });

    it('应该从请求对象中提取租户ID', () => {
      const httpDto: SignupDto = {
        email: 'user@example.com',
        password: 'password123',
        fullName: 'Test User',
        tenantName: 'test-tenant',
      };

      const mockReq = {
        tenantId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      } as unknown as FastifyRequest;

      const result = AuthMapper.toSignupInput(httpDto, mockReq);

      expect(result.tenantId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });
  });

  describe('toLoginInput', () => {
    it('应该将HTTP登录DTO转换为用例输入DTO', () => {
      const httpDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const result = AuthMapper.toLoginInput(httpDto, mockReq);

      expect(result).toMatchObject({
        email: httpDto.email,
        password: httpDto.password,
        deviceInfo: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });

    it('应该使用IP地址当没有x-forwarded-for时', () => {
      const httpDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const result = AuthMapper.toLoginInput(httpDto, mockReq);

      expect(result.ipAddress).toBe('127.0.0.1');
    });

    it('应该使用默认值当缺少头部信息时', () => {
      const httpDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockReq = {
        headers: {},
        ip: undefined,
      } as unknown as FastifyRequest;

      const result = AuthMapper.toLoginInput(httpDto, mockReq);

      expect(result.deviceInfo).toBe('Unknown Device');
      expect(result.ipAddress).toBe('Unknown IP');
    });

    it('应该处理x-forwarded-for中的多个IP地址', () => {
      const httpDto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const result = AuthMapper.toLoginInput(httpDto, mockReq);

      expect(result.ipAddress).toBe('192.168.1.1');
    });
  });

  describe('toRefreshTokenInput', () => {
    it('应该将刷新令牌请求转换为用例输入DTO', () => {
      const userId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      const refreshToken = 'refresh-token';

      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
        ip: '127.0.0.1',
      } as unknown as FastifyRequest;

      const result = AuthMapper.toRefreshTokenInput(
        userId,
        refreshToken,
        mockReq,
      );

      expect(result).toMatchObject({
        userId,
        refreshToken,
        deviceInfo: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });

    it('应该使用默认值当缺少头部信息时', () => {
      const userId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      const refreshToken = 'refresh-token';

      const mockReq = {
        headers: {},
        ip: undefined,
      } as unknown as FastifyRequest;

      const result = AuthMapper.toRefreshTokenInput(
        userId,
        refreshToken,
        mockReq,
      );

      expect(result.deviceInfo).toBe('Unknown Device');
      expect(result.ipAddress).toBe('Unknown IP');
    });
  });

  describe('toLogoutInput', () => {
    it('应该将登出请求转换为用例输入DTO（带刷新令牌）', () => {
      const userId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
      const refreshToken = 'refresh-token';

      const result = AuthMapper.toLogoutInput(userId, refreshToken);

      expect(result).toMatchObject({
        userId,
        refreshToken,
      });
    });

    it('应该将登出请求转换为用例输入DTO（无刷新令牌）', () => {
      const userId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

      const result = AuthMapper.toLogoutInput(userId);

      expect(result).toMatchObject({
        userId,
        refreshToken: undefined,
      });
    });
  });

  describe('toVerifyEmailInput', () => {
    it('应该将HTTP验证邮箱DTO转换为用例输入DTO', () => {
      const httpDto: VerifyEmailDto = {
        email: 'user@example.com',
        code: '123456',
      };

      const result = AuthMapper.toVerifyEmailInput(httpDto);

      expect(result).toMatchObject({
        email: httpDto.email,
        code: httpDto.code,
      });
    });
  });

  describe('toResendVerificationInput', () => {
    it('应该将HTTP重发验证码DTO转换为用例输入DTO', () => {
      const httpDto: ResendVerificationDto = {
        email: 'user@example.com',
      };

      const result = AuthMapper.toResendVerificationInput(httpDto);

      expect(result).toMatchObject({
        email: httpDto.email,
      });
    });
  });

  describe('toGetMeInput', () => {
    it('应该将用户ID转换为获取当前用户用例输入DTO', () => {
      const userId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

      const result = AuthMapper.toGetMeInput(userId);

      expect(result).toMatchObject({
        userId,
      });
    });
  });
});
