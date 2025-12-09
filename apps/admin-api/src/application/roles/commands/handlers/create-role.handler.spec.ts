import { ConflictException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../../domain/roles/entities/role.aggregate';
import type { IRoleRepository } from '../../../../domain/roles/repositories/role.repository.interface';
import { CreateRoleCommand } from '../create-role.command';
import { CreateRoleHandler } from './create-role.handler';

/**
 * 创建角色命令处理器单元测试
 *
 * 测试 CreateRoleHandler 的所有场景。
 *
 * @describe CreateRoleHandler
 */
describe('CreateRoleHandler', () => {
  let handler: CreateRoleHandler;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validTenantId = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validRoleId = '01ARZ3NDEKTSV4RRFFQ69G5FAX';
  const validRoleName = 'admin';
  const validDisplayName = 'Administrator';
  const validDescription = 'Administrator role';

  beforeEach(async () => {
    const mockRoleRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRoleHandler,
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateRoleHandler>(CreateRoleHandler);
    roleRepository = module.get('IRoleRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('应该被定义', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('应该成功创建角色', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: validDisplayName,
        description: validDescription,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateRoleCommand(
        validTenantId,
        validRoleName,
        validDisplayName,
        validDescription,
        true,
      );

      roleRepository.findByName.mockResolvedValue(null);
      jest.spyOn(Role, 'create').mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(undefined);
      jest.spyOn(mockRole, 'getUncommittedEvents').mockReturnValue([]);

      const result = await handler.execute(command);

      expect(roleRepository.findByName).toHaveBeenCalled();
      expect(Role.create).toHaveBeenCalled();
      expect(roleRepository.save).toHaveBeenCalled();
      expect(result.id).toBe(validRoleId);
      expect(result.name).toBe(validRoleName);
      expect(result.displayName).toBe(validDisplayName);
      expect(result.description).toBe(validDescription);
      expect(result.isActive).toBe(true);
    });

    it('应该抛出 ConflictException 当角色已存在时', async () => {
      const existingRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: validDisplayName,
        description: validDescription,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateRoleCommand(
        validTenantId,
        validRoleName,
        validDisplayName,
        validDescription,
        true,
      );

      roleRepository.findByName.mockResolvedValue(existingRole);

      await expect(handler.execute(command)).rejects.toThrow(ConflictException);
      await expect(handler.execute(command)).rejects.toThrow(
        `角色 ${validRoleName} 已存在`,
      );

      expect(roleRepository.findByName).toHaveBeenCalled();
      expect(roleRepository.save).not.toHaveBeenCalled();
    });

    it('应该发布领域事件', async () => {
      const mockRole = Role.reconstitute({
        id: validRoleId,
        name: validRoleName,
        tenantId: validTenantId,
        displayName: validDisplayName,
        description: validDescription,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const command = new CreateRoleCommand(
        validTenantId,
        validRoleName,
        validDisplayName,
        validDescription,
        true,
      );

      roleRepository.findByName.mockResolvedValue(null);
      jest.spyOn(Role, 'create').mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(undefined);
      const mockEvents = [{ type: 'RoleCreatedEvent' }];
      jest
        .spyOn(mockRole, 'getUncommittedEvents')
        .mockReturnValue(mockEvents as any);

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledWith(mockEvents);
    });
  });
});
