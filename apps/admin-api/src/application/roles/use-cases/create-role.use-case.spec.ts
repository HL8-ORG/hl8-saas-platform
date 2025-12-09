import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../domain/roles/repositories/role.repository.interface';
import { RoleName } from '../../../domain/roles/value-objects/role-name.vo';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { IEventBus } from '../../../infrastructure/events/event-bus';
import { CreateRoleInputDto } from '../dtos/create-role.input.dto';
import { CreateRoleUseCase } from './create-role.use-case';

/**
 * 创建角色用例单元测试
 *
 * 测试创建角色用例的所有场景。
 *
 * @describe CreateRoleUseCase
 */
describe('CreateRoleUseCase', () => {
  let useCase: CreateRoleUseCase;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';

  beforeEach(async () => {
    const mockRoleRepository = {
      findByName: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CreateRoleUseCase,
          useFactory: (roleRepo: IRoleRepository, eventBus: IEventBus) => {
            return new CreateRoleUseCase(roleRepo, eventBus);
          },
          inject: ['IRoleRepository', 'IEventBus'],
        },
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

    useCase = module.get<CreateRoleUseCase>(CreateRoleUseCase);
    roleRepository = module.get('IRoleRepository');
    eventBus = module.get('IEventBus');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    const input: CreateRoleInputDto = {
      tenantId: validTenantId,
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrator role',
      isActive: true,
    };

    it('应该成功创建角色', async () => {
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(roleRepository.findByName).toHaveBeenCalledWith(
        expect.any(RoleName),
        expect.any(TenantId),
      );
      expect(roleRepository.save).toHaveBeenCalledWith(expect.any(Role));
      expect(eventBus.publishAll).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: expect.any(String),
        name: input.name,
        displayName: input.displayName,
        description: input.description,
        isActive: input.isActive,
      });
    });

    it('应该创建未激活的角色', async () => {
      const inactiveInput = {
        ...input,
        isActive: false,
      };

      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(inactiveInput);

      expect(result.isActive).toBe(false);
    });

    it('应该创建没有描述的角色', async () => {
      const inputWithoutDescription = {
        ...input,
        description: undefined,
      };

      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      const result = await useCase.execute(inputWithoutDescription);

      expect(result.description).toBeNull();
    });

    it('应该抛出 ConflictException 当角色名称已存在时', async () => {
      const existingRole = Role.reconstitute({
        id: validRoleId,
        name: input.name,
        displayName: 'Existing Role',
        description: null,
        isActive: true,
        tenantId: validTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      roleRepository.findByName.mockResolvedValue(existingRole);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictException);
      await expect(useCase.execute(input)).rejects.toThrow(
        `角色 ${input.name} 已存在`,
      );
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      await useCase.execute(input);

      // Role.create 会发布 RoleCreatedEvent，use case 会调用 publishAll
      // 检查 publishAll 是否被调用（即使事件数组可能为空，也应该被调用）
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('应该使用正确的租户ID', async () => {
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      await useCase.execute(input);

      const findByNameCall = roleRepository.findByName.mock.calls[0];
      const tenantId = findByNameCall[1] as TenantId;
      expect(tenantId.toString()).toBe(validTenantId);
    });

    it('应该使用正确的角色名称', async () => {
      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.save.mockResolvedValue(undefined);

      await useCase.execute(input);

      const findByNameCall = roleRepository.findByName.mock.calls[0];
      const roleName = findByNameCall[0] as RoleName;
      expect(roleName.value).toBe(input.name);
    });
  });
});
