import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import type { IEventBus } from '../../../infrastructure/events/event-bus';
import { DeleteRoleInputDto } from '../dtos/delete-role.input.dto';
import { DeleteRoleUseCase } from './delete-role.use-case';

/**
 * 删除角色用例单元测试
 *
 * 测试删除角色用例的所有场景。
 *
 * @describe DeleteRoleUseCase
 */
describe('DeleteRoleUseCase', () => {
  let useCase: DeleteRoleUseCase;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishAll: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteRoleUseCase,
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
      ],
    }).compile();

    useCase = module.get<DeleteRoleUseCase>(DeleteRoleUseCase);
    roleRepository = module.get('IRoleRepository');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('应该被定义', () => {
      expect(useCase).toBeDefined();
    });

    it('应该成功删除角色', async () => {
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

      const input = new DeleteRoleInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleRepository.findById.mockResolvedValue(mockRole);

      const result = await useCase.execute(input);

      expect(result).toBeInstanceOf(Object);
      expect(result.message).toBe('角色删除成功');

      expect(roleRepository.findById).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(roleRepository.delete).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该处理角色不存在的情况', async () => {
      const input = new DeleteRoleInputDto({
        roleId: validRoleId,
        tenantId: validTenantId,
      });

      roleRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

      expect(roleRepository.findById).toHaveBeenCalled();
      expect(roleRepository.delete).not.toHaveBeenCalled();
      expect(eventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
