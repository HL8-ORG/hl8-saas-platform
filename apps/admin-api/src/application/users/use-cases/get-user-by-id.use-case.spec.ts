import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '../../../domain/users/entities/user.aggregate';
import type { IUserReadRepository } from '../../../domain/users/repositories/user-read.repository.interface';
import { GetUserByIdInputDto } from '../dtos/get-user-by-id.input.dto';
import { GetUserByIdUseCase } from './get-user-by-id.use-case';

/**
 * 根据ID获取用户用例单元测试
 *
 * 测试根据ID获取用户用例的所有场景。
 *
 * @describe GetUserByIdUseCase
 */
describe('GetUserByIdUseCase', () => {
  let useCase: GetUserByIdUseCase;
  let userReadRepository: jest.Mocked<IUserReadRepository>;

  const validUserId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserReadRepository = {
      findById: jest.fn(),
      findMany: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserByIdUseCase,
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUserByIdUseCase>(GetUserByIdUseCase);
    userReadRepository = module.get('IUserReadRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input = new GetUserByIdInputDto(validUserId, validTenantId);

    it('应该返回用户信息', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userReadRepository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(input);

      expect(userReadRepository.findById).toHaveBeenCalled();
      expect(result).toHaveProperty('id', validUserId);
      expect(result).toHaveProperty('email', 'user@example.com');
      expect(result).toHaveProperty('fullName', 'Test User');
      expect(result).toHaveProperty('role', 'USER');
      expect(result).toHaveProperty('isActive', true);
      expect(result).toHaveProperty('isEmailVerified', true);
    });

    it('应该处理用户不存在的情况', async () => {
      userReadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(userReadRepository.findById).toHaveBeenCalled();
    });

    it('应该使用正确的用户ID和租户ID', async () => {
      const mockUser = User.reconstitute({
        id: validUserId,
        email: 'user@example.com',
        passwordHash: validBcryptHash,
        fullName: 'Test User',
        role: UserRole.USER,
        isActive: true,
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiresAt: null,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userReadRepository.findById.mockResolvedValue(mockUser);

      await useCase.execute(input);

      const findByIdCall = userReadRepository.findById.mock.calls[0];
      expect(findByIdCall[0].toString()).toBe(validUserId);
      expect(findByIdCall[1].toString()).toBe(validTenantId);
    });
  });
});
