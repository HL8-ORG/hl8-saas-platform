import { Test, TestingModule } from '@nestjs/testing';
import type { IUserReadRepository } from '../../../../domain/users/repositories/user-read.repository.interface';
import { User } from '../../../domain/users/entities/user.aggregate';
import { GetUsersInputDto } from '../dtos/get-users.input.dto';
import { GetUsersUseCase } from './get-users.use-case';

/**
 * 获取用户列表用例单元测试
 *
 * 测试获取用户列表用例的所有场景。
 *
 * @describe GetUsersUseCase
 */
describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let userReadRepository: jest.Mocked<IUserReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validUserId1 = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validUserId2 = '01ARZ3NDEKTSV4RRFFQ69G5FAY';
  const validBcryptHash =
    '$2a$12$abcdefghijklmnopqrstuvwxyABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij';

  beforeEach(async () => {
    const mockUserReadRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GetUsersUseCase,
          useFactory: (userReadRepo: IUserReadRepository) => {
            return new GetUsersUseCase(userReadRepo);
          },
          inject: ['IUserReadRepository'],
        },
        {
          provide: 'IUserReadRepository',
          useValue: mockUserReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetUsersUseCase>(GetUsersUseCase);
    userReadRepository = module.get('IUserReadRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: GetUsersInputDto = {
      tenantId: validTenantId,
      page: 1,
      limit: 10,
    };

    it('应该返回用户列表', async () => {
      const users = [
        User.reconstitute({
          id: validUserId1,
          email: 'user1@example.com',
          passwordHash: validBcryptHash,
          fullName: 'User One',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        User.reconstitute({
          id: validUserId2,
          email: 'user2@example.com',
          passwordHash: validBcryptHash,
          fullName: 'User Two',
          role: 'USER',
          isActive: true,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiresAt: null,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      userReadRepository.findMany.mockResolvedValue({
        data: users,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      });

      const result = await useCase.execute(input);

      expect(userReadRepository.findMany).toHaveBeenCalledWith({
        tenantId: validTenantId,
        page: 1,
        limit: 10,
        isActive: undefined,
        search: undefined,
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('应该返回空列表当没有用户时', async () => {
      userReadRepository.findMany.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('应该使用正确的分页参数', async () => {
      const paginatedInput = {
        ...input,
        page: 2,
        limit: 20,
      };

      userReadRepository.findMany.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 20,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });

      await useCase.execute(paginatedInput);

      expect(userReadRepository.findMany).toHaveBeenCalledWith({
        tenantId: validTenantId,
        page: 2,
        limit: 20,
        isActive: undefined,
        search: undefined,
      });
    });

    it('应该使用正确的租户ID', async () => {
      userReadRepository.findMany.mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      });

      await useCase.execute(input);

      const findManyCall = userReadRepository.findMany.mock.calls[0];
      expect(findManyCall[0].tenantId).toBe(validTenantId);
    });
  });
});
