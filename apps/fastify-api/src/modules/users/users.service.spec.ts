import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

/**
 * 用户服务单元测试
 *
 * 测试用户服务的核心业务逻辑，包括用户资料管理和用户列表查询。
 *
 * @describe UsersService
 */
describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    fullName: 'Test User',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
      findAndCount: jest.fn(),
    };

    const mockRefreshTokenRepository = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    const userId = 'user-1';

    it('应该返回用户资料', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('当用户不存在时应该返回 null', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.getProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    const userId = 'user-1';
    const updateProfileDto: UpdateProfileDto = {
      fullName: 'Updated Name',
    };

    it('应该成功更新用户资料', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      userRepository.update.mockResolvedValue(undefined as any);
      userRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(userRepository.update).toHaveBeenCalledWith(
        userId,
        updateProfileDto,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toHaveProperty('fullName', 'Updated Name');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('getAllUsers', () => {
    it('应该返回分页用户列表', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.getAllUsers(1, 10);

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total', 1);
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 10);
      expect(result.meta).toHaveProperty('totalPages', 1);
      expect(result.meta).toHaveProperty('hasNext', false);
      expect(result.meta).toHaveProperty('hasPrevious', false);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
    });

    it('应该正确处理分页参数', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-2' }];
      userRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.getAllUsers(2, 1);

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 1,
        take: 1,
        order: { createdAt: 'DESC' },
      });
      expect(result.meta).toHaveProperty('page', 2);
      expect(result.meta).toHaveProperty('limit', 1);
      expect(result.meta).toHaveProperty('totalPages', 2);
      expect(result.meta).toHaveProperty('hasNext', false);
      expect(result.meta).toHaveProperty('hasPrevious', true);
    });

    it('应该使用默认分页参数', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.getAllUsers();

      expect(userRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.meta).toHaveProperty('page', 1);
      expect(result.meta).toHaveProperty('limit', 10);
    });
  });

  describe('getUserById', () => {
    const userId = 'user-1';

    it('应该返回用户信息', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('当用户不存在时应该返回 null', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserById(userId);

      expect(result).toBeNull();
    });

    it('当 userId 为空时应该返回 null', async () => {
      const result = await service.getUserById('');

      expect(userRepository.findOne).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateUserById', () => {
    const userId = 'user-1';
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
      role: 'ADMIN',
    };

    it('应该成功更新用户信息', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      userRepository.update.mockResolvedValue(undefined as any);
      userRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.updateUserById(userId, updateUserDto);

      expect(userRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toHaveProperty('fullName', 'Updated Name');
      expect(result).toHaveProperty('role', 'ADMIN');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('deleteUserById', () => {
    const userId = 'user-1';

    it('应该成功删除用户（软删除）', async () => {
      userRepository.update.mockResolvedValue(undefined as any);
      refreshTokenRepository.delete.mockResolvedValue(undefined as any);

      const result = await service.deleteUserById(userId);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith({ userId });
      expect(result).toHaveProperty('message', 'User deleted successfully');
    });
  });

  describe('sanitizeUser', () => {
    it('应该移除敏感信息', () => {
      const userWithSensitiveData = {
        ...mockUser,
        refreshToken: 'old-refresh-token',
      };

      const result = service.sanitizeUser(userWithSensitiveData);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });

    it('当用户为 null 时应该返回 null', () => {
      const result = service.sanitizeUser(null);

      expect(result).toBeNull();
    });
  });
});
