import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '../../../domain/permissions/entities/permission.aggregate';
import type { IPermissionRepository } from '../../../domain/permissions/repositories/permission.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { CreatePermissionInputDto } from '../dtos/create-permission.input.dto';
import { CreatePermissionUseCase } from './create-permission.use-case';

/**
 * 创建权限用例单元测试
 *
 * 测试创建权限用例的所有场景。
 *
 * @describe CreatePermissionUseCase
 */
describe('CreatePermissionUseCase', () => {
  let useCase: CreatePermissionUseCase;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validPermissionId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockPermissionRepository = {
      findByResourceAndAction: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionUseCase,
        {
          provide: 'IPermissionRepository',
          useValue: mockPermissionRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    useCase = module.get<CreatePermissionUseCase>(CreatePermissionUseCase);
    permissionRepository = module.get('IPermissionRepository');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功创建权限', async () => {
      const input: CreatePermissionInputDto = {
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
      };

      permissionRepository.findByResourceAndAction.mockResolvedValue(null);
      permissionRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBeDefined();
      expect(result.resource).toBe('users');
      expect(result.action).toBe('create');
      expect(result.description).toBe('Create users');

      expect(permissionRepository.findByResourceAndAction).toHaveBeenCalledWith(
        'users',
        'create',
        expect.any(Object),
      );
      expect(permissionRepository.save).toHaveBeenCalledWith(
        expect.any(Permission),
      );
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该成功创建没有描述的权限', async () => {
      const input: CreatePermissionInputDto = {
        tenantId: validTenantId,
        resource: 'users',
        action: 'read',
      };

      permissionRepository.findByResourceAndAction.mockResolvedValue(null);
      permissionRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBeDefined();
      expect(result.resource).toBe('users');
      expect(result.action).toBe('read');
      expect(result.description).toBeNull();

      expect(permissionRepository.findByResourceAndAction).toHaveBeenCalled();
      expect(permissionRepository.save).toHaveBeenCalled();
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理权限已存在的情况', async () => {
      const existingPermission = Permission.reconstitute({
        id: validPermissionId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const input: CreatePermissionInputDto = {
        tenantId: validTenantId,
        resource: 'users',
        action: 'create',
        description: 'Create users',
      };

      permissionRepository.findByResourceAndAction.mockResolvedValue(
        existingPermission,
      );

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

      expect(permissionRepository.findByResourceAndAction).toHaveBeenCalled();
      expect(permissionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
