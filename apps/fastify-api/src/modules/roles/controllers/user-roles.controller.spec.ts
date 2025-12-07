import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../../../entities/role.entity';
import { User } from '../../../entities/user.entity';
import { AuthZService } from '../../authz/services/authz.service';
import { UsersService } from '../../users/users.service';
import { AssignUserRoleDto } from '../dtos/assign-user-role.dto';
import { RolesService } from '../services/roles.service';
import { UserRolesController } from './user-roles.controller';

/**
 * 用户角色控制器单元测试
 *
 * 测试用户角色控制器的 HTTP 请求处理逻辑。
 *
 * @describe UserRolesController
 */
describe('UserRolesController', () => {
  let controller: UserRolesController;
  let usersService: jest.Mocked<UsersService>;
  let rolesService: jest.Mocked<RolesService>;
  let authzService: jest.Mocked<AuthZService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    isActive: true,
  } as User;

  const mockRole: Role = {
    id: 'role-1',
    name: 'admin',
    displayName: '管理员',
    isActive: true,
  } as Role;

  beforeEach(async () => {
    const mockUsersService = {
      getUserById: jest.fn(),
    };

    const mockRolesService = {
      assignUser: jest.fn(),
      deAssignUser: jest.fn(),
      findById: jest.fn(),
    };

    const mockAuthzService = {
      getRolesForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserRolesController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: AuthZService,
          useValue: mockAuthzService,
        },
      ],
    }).compile();

    controller = module.get<UserRolesController>(UserRolesController);
    usersService = module.get(UsersService);
    rolesService = module.get(RolesService);
    authzService = module.get(AuthZService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findUserRoles', () => {
    const userId = 'user-1';
    const currentUserId = 'user-1';

    it('应该返回用户的所有角色', async () => {
      const roles = ['admin', 'editor'];
      usersService.getUserById.mockResolvedValue(mockUser);
      authzService.getRolesForUser.mockResolvedValue(roles);

      const result = await controller.findUserRoles(userId, currentUserId);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(authzService.getRolesForUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(roles);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      usersService.getUserById.mockResolvedValue(null);

      await expect(
        controller.findUserRoles(userId, currentUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findUserRoles(userId, currentUserId),
      ).rejects.toThrow('用户不存在');
      expect(authzService.getRolesForUser).not.toHaveBeenCalled();
    });
  });

  describe('assignUserRole', () => {
    const userId = 'user-1';
    const assignRoleDto: AssignUserRoleDto = {
      roleName: 'admin',
    };

    it('应该成功为用户分配角色', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      rolesService.assignUser.mockResolvedValue(true);

      const result = await controller.assignUserRole(userId, assignRoleDto);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(rolesService.assignUser).toHaveBeenCalledWith(
        userId,
        assignRoleDto.roleName,
      );
      expect(result).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      usersService.getUserById.mockResolvedValue(null);

      await expect(
        controller.assignUserRole(userId, assignRoleDto),
      ).rejects.toThrow(NotFoundException);
      expect(rolesService.assignUser).not.toHaveBeenCalled();
    });

    it('当尝试修改 root 用户的角色时应该抛出 BadRequestException', async () => {
      const rootUser = {
        ...mockUser,
        email: 'root',
        id: 'root',
      };
      usersService.getUserById.mockResolvedValue(rootUser);

      await expect(
        controller.assignUserRole('root', assignRoleDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.assignUserRole('root', assignRoleDto),
      ).rejects.toThrow('内置 root 用户的角色不能修改');
      expect(rolesService.assignUser).not.toHaveBeenCalled();
    });

    it('当用户 ID 为 root 时应该抛出 BadRequestException', async () => {
      const rootUser = {
        ...mockUser,
        id: 'root',
      };
      usersService.getUserById.mockResolvedValue(rootUser);

      await expect(
        controller.assignUserRole('root', assignRoleDto),
      ).rejects.toThrow(BadRequestException);
      expect(rolesService.assignUser).not.toHaveBeenCalled();
    });
  });

  describe('deAssignUserRole', () => {
    const userId = 'user-1';
    const roleId = 'role-1';

    it('应该成功取消用户的角色分配', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      rolesService.findById.mockResolvedValue(mockRole);
      rolesService.deAssignUser.mockResolvedValue(true);

      const result = await controller.deAssignUserRole(userId, roleId);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(rolesService.findById).toHaveBeenCalledWith(roleId);
      expect(rolesService.deAssignUser).toHaveBeenCalledWith(
        userId,
        mockRole.name,
      );
      expect(result).toBe(true);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      usersService.getUserById.mockResolvedValue(null);
      rolesService.findById.mockResolvedValue(mockRole);

      await expect(controller.deAssignUserRole(userId, roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.deAssignUserRole(userId, roleId)).rejects.toThrow(
        '用户不存在',
      );
      expect(rolesService.deAssignUser).not.toHaveBeenCalled();
    });

    it('当角色不存在时应该抛出 NotFoundException', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      rolesService.findById.mockResolvedValue(null);

      await expect(controller.deAssignUserRole(userId, roleId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.deAssignUserRole(userId, roleId)).rejects.toThrow(
        '角色不存在',
      );
      expect(rolesService.deAssignUser).not.toHaveBeenCalled();
    });
  });
});
