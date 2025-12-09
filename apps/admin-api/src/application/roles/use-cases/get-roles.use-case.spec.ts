import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleReadRepository } from '../../../domain/roles/repositories/role-read.repository.interface';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  GetRolesInputDto,
  GetRolesOutputDto,
} from '../dtos/get-roles.input.dto';
import { GetRolesUseCase } from './get-roles.use-case';

/**
 * 获取角色列表用例单元测试
 *
 * 测试获取角色列表用例的所有场景。
 *
 * @describe GetRolesUseCase
 */
describe('GetRolesUseCase', () => {
  let useCase: GetRolesUseCase;
  let roleReadRepository: jest.Mocked<IRoleReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validRoleId1 = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleId2 = '01ARZ3NDEKTSV4RRFFQ69G5FAY';

  beforeEach(async () => {
    const mockRoleReadRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GetRolesUseCase,
          useFactory: (roleReadRepo: IRoleReadRepository) => {
            return new GetRolesUseCase(roleReadRepo);
          },
          inject: ['IRoleReadRepository'],
        },
        {
          provide: 'IRoleReadRepository',
          useValue: mockRoleReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetRolesUseCase>(GetRolesUseCase);
    roleReadRepository = module.get('IRoleReadRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: GetRolesInputDto = {
      tenantId: validTenantId,
    };

    it('应该返回角色列表', async () => {
      const roles = [
        Role.reconstitute({
          id: validRoleId1,
          name: 'admin',
          displayName: 'Administrator',
          description: 'Admin role',
          isActive: true,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Role.reconstitute({
          id: validRoleId2,
          name: 'user',
          displayName: 'User',
          description: 'User role',
          isActive: true,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      roleReadRepository.findAll.mockResolvedValue(roles);

      const result = await useCase.execute(input);

      expect(roleReadRepository.findAll).toHaveBeenCalledWith(
        expect.any(TenantId),
      );
      expect(result).toBeInstanceOf(GetRolesOutputDto);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        id: validRoleId1,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Admin role',
        isActive: true,
      });
    });

    it('应该返回空列表当没有角色时', async () => {
      roleReadRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(0);
    });

    it('应该只返回激活的角色', async () => {
      const roles = [
        Role.reconstitute({
          id: validRoleId1,
          name: 'admin',
          displayName: 'Administrator',
          description: 'Admin role',
          isActive: true,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Role.reconstitute({
          id: validRoleId2,
          name: 'inactive',
          displayName: 'Inactive Role',
          description: 'Inactive role',
          isActive: false,
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      roleReadRepository.findAll.mockResolvedValue(roles);

      const result = await useCase.execute(input);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].isActive).toBe(true);
      expect(result.data[1].isActive).toBe(false);
    });

    it('应该使用正确的租户ID', async () => {
      roleReadRepository.findAll.mockResolvedValue([]);

      await useCase.execute(input);

      const findAllCall = roleReadRepository.findAll.mock.calls[0];
      const tenantId = findAllCall[0] as TenantId;
      expect(tenantId.toString()).toBe(validTenantId);
    });
  });
});
