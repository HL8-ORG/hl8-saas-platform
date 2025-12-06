import { Test, TestingModule } from '@nestjs/testing';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { UserRole } from '../../common/guards/roles.guard';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * 用户控制器单元测试
 *
 * 测试用户控制器的 HTTP 请求处理逻辑。
 *
 * @describe UsersController
 */
describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    role: 'USER',
    isActive: true,
  };

  beforeEach(async () => {
    const mockUsersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      updateUserById: jest.fn(),
      deleteUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    const userId = 'user-1';

    it('应该返回用户资料', async () => {
      usersService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(userId);

      expect(usersService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-1';
    const updateProfileDto: UpdateProfileDto = {
      fullName: 'Updated Name',
    };

    it('应该成功更新用户资料', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      usersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(userId, updateProfileDto);

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getAllUsers', () => {
    it('应该返回分页用户列表', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      usersService.getAllUsers.mockResolvedValue(mockResponse);

      const result = await controller.getAllUsers(paginationDto);

      expect(usersService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResponse);
    });

    it('应该使用默认分页参数', async () => {
      const paginationDto: PaginationDto = {};
      const mockResponse = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      usersService.getAllUsers.mockResolvedValue(mockResponse);

      const result = await controller.getAllUsers(paginationDto);

      expect(usersService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserById', () => {
    const userId = 'user-1';

    it('应该返回用户信息', async () => {
      usersService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(userId);

      expect(usersService.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('当用户不存在时应该返回 null', async () => {
      usersService.getUserById.mockResolvedValue(null);

      const result = await controller.getUserById(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserById', () => {
    const userId = 'user-1';
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
      role: UserRole.ADMIN,
    };

    it('应该成功更新用户信息', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      usersService.updateUserById.mockResolvedValue(updatedUser);

      const result = await controller.updateUserById(userId, updateUserDto);

      expect(usersService.updateUserById).toHaveBeenCalledWith(
        userId,
        updateUserDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUserById', () => {
    const userId = 'user-1';

    it('应该成功删除用户', async () => {
      usersService.deleteUserById.mockResolvedValue({
        message: 'User deleted successfully',
      });

      const result = await controller.deleteUserById(userId);

      expect(usersService.deleteUserById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('message', 'User deleted successfully');
    });
  });
});
