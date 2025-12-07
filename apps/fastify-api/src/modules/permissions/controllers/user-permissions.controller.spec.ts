import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../../../entities/user.entity';
import { AuthZService } from '../../authz/services/authz.service';
import { UsersService } from '../../users/users.service';
import { UserPermissionsController } from './user-permissions.controller';

/**
 * 用户权限控制器单元测试
 *
 * 测试用户权限控制器的 HTTP 请求处理逻辑。
 *
 * @describe UserPermissionsController
 */
describe('UserPermissionsController', () => {
  let controller: UserPermissionsController;
  let usersService: jest.Mocked<UsersService>;
  let authzService: jest.Mocked<AuthZService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    isActive: true,
  } as User;

  beforeEach(async () => {
    const mockUsersService = {
      getUserById: jest.fn(),
    };

    const mockAuthZService = {
      getPermissionsForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPermissionsController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthZService,
          useValue: mockAuthZService,
        },
      ],
    }).compile();

    controller = module.get<UserPermissionsController>(
      UserPermissionsController,
    );
    usersService = module.get(UsersService);
    authzService = module.get(AuthZService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findUserPermissions', () => {
    const userId = 'user-1';
    const currentUserId = 'user-1';

    it('应该返回用户的所有权限', async () => {
      const permissions = [
        ['user', 'read'],
        ['user', 'write'],
      ];
      usersService.getUserById.mockResolvedValue(mockUser);
      authzService.getPermissionsForUser.mockResolvedValue(permissions);

      const result = await controller.findUserPermissions(
        userId,
        currentUserId,
      );

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(authzService.getPermissionsForUser).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(result).toEqual(permissions);
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      usersService.getUserById.mockResolvedValue(null);

      await expect(
        controller.findUserPermissions(userId, currentUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.findUserPermissions(userId, currentUserId),
      ).rejects.toThrow('用户不存在');
      expect(authzService.getPermissionsForUser).not.toHaveBeenCalled();
    });

    it('当用户是 root 用户（通过 email）时应该返回所有权限', async () => {
      const rootUser = {
        ...mockUser,
        email: 'root',
      };
      usersService.getUserById.mockResolvedValue(rootUser);

      const result = await controller.findUserPermissions(
        userId,
        currentUserId,
      );

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(authzService.getPermissionsForUser).not.toHaveBeenCalled();
      expect(result).toEqual(['*']);
    });

    it('当用户是 root 用户（通过 id）时应该返回所有权限', async () => {
      const rootUser = {
        ...mockUser,
        id: 'root',
      };
      usersService.getUserById.mockResolvedValue(rootUser);

      const result = await controller.findUserPermissions(
        'root',
        currentUserId,
      );

      expect(usersService.getUserById).toHaveBeenCalledWith('root');
      expect(authzService.getPermissionsForUser).not.toHaveBeenCalled();
      expect(result).toEqual(['*']);
    });

    it('应该返回空数组当用户没有权限时', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);
      authzService.getPermissionsForUser.mockResolvedValue([]);

      const result = await controller.findUserPermissions(
        userId,
        currentUserId,
      );

      expect(result).toEqual([]);
    });
  });
});
