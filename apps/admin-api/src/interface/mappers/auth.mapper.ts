import type { FastifyRequest } from 'fastify';
import { GetMeInputDto } from '../../application/auth/dtos/get-me.input.dto';
import { LoginInputDto } from '../../application/auth/dtos/login.input.dto';
import { LogoutInputDto } from '../../application/auth/dtos/logout.input.dto';
import { RefreshTokenInputDto } from '../../application/auth/dtos/refresh-token.input.dto';
import { ResendVerificationInputDto } from '../../application/auth/dtos/resend-verification.input.dto';
import { SignupInputDto } from '../../application/auth/dtos/signup.input.dto';
import { VerifyEmailInputDto } from '../../application/auth/dtos/verify-email.input.dto';
import { LoginDto as HttpLoginDto } from '../dtos/auth/login.dto';
import { ResendVerificationDto as HttpResendVerificationDto } from '../dtos/auth/resend-verification.dto';
import { SignupDto as HttpSignupDto } from '../dtos/auth/signup.dto';
import { VerifyEmailDto as HttpVerifyEmailDto } from '../dtos/auth/verify-email.dto';

import { SignupCommand } from '../../application/auth/commands/signup.command';

/**
 * 认证HTTP DTO映射器
 *
 * 负责HTTP层的DTO和应用层用例DTO之间的映射转换。
 * 处理HTTP请求到用例输入参数的转换。
 *
 * @class AuthMapper
 * @description HTTP DTO ↔ 用例DTO映射器
 */
export class AuthMapper {
  /**
   * 将HTTP注册DTO转换为注册命令
   *
   * @param {HttpSignupDto} httpDto - HTTP注册DTO
   * @returns {SignupCommand} 注册命令
   */
  static toSignupCommand(httpDto: HttpSignupDto): SignupCommand {
    return new SignupCommand(
      httpDto.email,
      httpDto.password,
      httpDto.fullName,
      httpDto.tenantName,
    );
  }

  /**
   * 将HTTP注册DTO转换为用例输入DTO
   *
   * @param {HttpSignupDto} httpDto - HTTP注册DTO
   * @param {FastifyRequest} [req] - 可选的请求对象（用于获取租户ID）
   * @returns {SignupInputDto} 用例输入DTO
   */
  static toSignupInput(
    httpDto: HttpSignupDto,
    req?: FastifyRequest,
  ): SignupInputDto {
    return {
      email: httpDto.email,
      password: httpDto.password,
      fullName: httpDto.fullName,
      tenantId: req
        ? ((req as any)['tenantId'] as string | undefined)
        : undefined,
    };
  }

  /**
   * 将HTTP登录DTO转换为用例输入DTO
   *
   * @param {HttpLoginDto} httpDto - HTTP登录DTO
   * @param {FastifyRequest} req - 请求对象（用于获取设备信息和IP地址）
   * @returns {LoginInputDto} 用例输入DTO
   */
  static toLoginInput(
    httpDto: HttpLoginDto,
    req: FastifyRequest,
  ): LoginInputDto {
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      'Unknown IP';

    return {
      email: httpDto.email,
      password: httpDto.password,
      deviceInfo,
      ipAddress,
    };
  }

  /**
   * 将HTTP刷新令牌请求转换为用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {string} refreshToken - 刷新令牌
   * @param {FastifyRequest} req - 请求对象
   * @returns {RefreshTokenInputDto} 用例输入DTO
   */
  static toRefreshTokenInput(
    userId: string,
    refreshToken: string,
    req: FastifyRequest,
  ): RefreshTokenInputDto {
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.ip ||
      'Unknown IP';

    return {
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
    };
  }

  /**
   * 将HTTP登出请求转换为用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @param {string} [refreshToken] - 可选的刷新令牌
   * @returns {LogoutInputDto} 用例输入DTO
   */
  static toLogoutInput(userId: string, refreshToken?: string): LogoutInputDto {
    return {
      userId,
      refreshToken,
    };
  }

  /**
   * 将HTTP验证邮箱DTO转换为用例输入DTO
   *
   * @param {HttpVerifyEmailDto} httpDto - HTTP验证邮箱DTO
   * @returns {VerifyEmailInputDto} 用例输入DTO
   */
  static toVerifyEmailInput(httpDto: HttpVerifyEmailDto): VerifyEmailInputDto {
    return {
      email: httpDto.email,
      code: httpDto.code,
    };
  }

  /**
   * 将HTTP重发验证码DTO转换为用例输入DTO
   *
   * @param {HttpResendVerificationDto} httpDto - HTTP重发验证码DTO
   * @returns {ResendVerificationInputDto} 用例输入DTO
   */
  static toResendVerificationInput(
    httpDto: HttpResendVerificationDto,
  ): ResendVerificationInputDto {
    return {
      email: httpDto.email,
    };
  }

  /**
   * 将用户ID转换为获取当前用户用例输入DTO
   *
   * @param {string} userId - 用户ID
   * @returns {GetMeInputDto} 用例输入DTO
   */
  static toGetMeInput(userId: string): GetMeInputDto {
    return {
      userId,
    };
  }
}
