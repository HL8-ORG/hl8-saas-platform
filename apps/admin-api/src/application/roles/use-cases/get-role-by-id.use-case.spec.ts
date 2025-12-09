import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import { GetRoleByIdInputDto } from '../dtos/get-role-by-id.input.dto';
import { GetRoleByIdUseCase } from './get-role-by-id.use-case';

/**
 * 根据ID获取角色用例单元测试
 *
 * 测试根据ID获取角色用例的所有场景。
 *
 * @describe GetRoleByIdUseCase
 */
describe('GetRoleByIdUseCase', () => {
  let useCase: GetRoleByIdUseCase;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockRoleReadRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRoleByIdUseCase,
        {
          provide: 'IRoleReadRepository',
          useValue: mockRoleReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetRoleByIdUseCase>(GetRoleByIdUseCase);
    roleReadRepository = module.get('IRoleReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取角色信息', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role',
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input = new GetRoleByIdInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleReadRepository.findById.mockResolvedValue(mockRole);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(validRoleId);
      expect(result.name).toBe('admin');
      expect(result.displayName).toBe('Administrator');
      expect(result.description).toBe('Administrator role');
      expect(result.isActive).toBe(true);

      expect(roleReadRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('应该处理角色不存在的情况', async () => {
      const input = new GetRoleByIdInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleReadRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(roleReadRepository.findById).toHaveBeenCalled();
    });
  });
});
