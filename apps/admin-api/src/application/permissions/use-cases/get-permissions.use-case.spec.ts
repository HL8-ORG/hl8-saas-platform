import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../domain/permissions/entities/permission.aggregate';
import type { IPermissionReadRepository } from '../../../domain/permissions/repositories/permission-read.repository.interface';
import { GetPermissionsInputDto } from '../dtos/get-permissions.input.dto';
import { GetPermissionsUseCase } from './get-permissions.use-case';

/**
 * 获取权限列表用例单元测试
 *
 * 测试获取权限列表用例的所有场景。
 *
 * @describe GetPermissionsUseCase
 */
describe('GetPermissionsUseCase', () => {
  let useCase: GetPermissionsUseCase;
  let permissionReadRepository: jest.Mocked<IPermissionReadRepository>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validPermissionId1 = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validPermissionId2 = '01ARZ3NDEKTSV4RRFFQ69G5FAY';

  beforeEach(async () => {
    const mockPermissionReadRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPermissionsUseCase,
        {
          provide: 'IPermissionReadRepository',
          useValue: mockPermissionReadRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPermissionsUseCase>(GetPermissionsUseCase);
    permissionReadRepository = module.get('IPermissionReadRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功获取权限列表', async () => {
      const mockPermissions = [
        Permission.reconstitute({
          id: validPermissionId1,
          resource: 'users',
          action: 'create',
          description: 'Create users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        Permission.reconstitute({
          id: validPermissionId2,
          resource: 'users',
          action: 'read',
          description: 'Read users',
          tenantId: validTenantId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const input: GetPermissionsInputDto = {
        tenantId: validTenantId,
      };

      permissionReadRepository.findAll.mockResolvedValue(mockPermissions);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Object);
      expect(result[0].id).toBe(validPermissionId1);
      expect(result[0].resource).toBe('users');
      expect(result[0].action).toBe('create');
      expect(result[0].description).toBe('Create users');
      expect(result[1].id).toBe(validPermissionId2);
      expect(result[1].resource).toBe('users');
      expect(result[1].action).toBe('read');
      expect(result[1].description).toBe('Read users');

      expect(permissionReadRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('应该处理空权限列表的情况', async () => {
      const input: GetPermissionsInputDto = {
        tenantId: validTenantId,
      };

      permissionReadRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);

      expect(permissionReadRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });
  });
});
