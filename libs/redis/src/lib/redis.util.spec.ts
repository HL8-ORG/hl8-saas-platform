import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Logger } from '@nestjs/common';

import { RedisUtility } from './redis.util';

// Mock ioredis
jest.mock('ioredis', () => {
  const mockClient = {
    on: jest.fn<any>(),
    quit: jest.fn<any>().mockResolvedValue('OK'),
    set: jest.fn<any>(),
    get: jest.fn<any>(),
    ping: jest.fn<any>(),
  };

  const MockRedis = jest.fn<any>().mockImplementation(() => mockClient);
  const MockCluster = jest.fn<any>().mockImplementation(() => mockClient);

  MockRedis.Cluster = MockCluster;

  return {
    default: MockRedis,
    __esModule: true,
  };
});

// Mock @hl8/config
jest.mock('@hl8/config', () => {
  const mockStandaloneConfig = {
    mode: 'standalone',
    standalone: {
      host: 'localhost',
      port: 6379,
      password: 'test-password',
      db: 0,
    },
    cluster: [],
    sentinel: {
      sentinels: [],
      name: 'master',
      password: '',
      db: 0,
    },
  };

  const mockClusterConfig = {
    mode: 'cluster',
    standalone: {
      host: 'localhost',
      port: 6379,
      password: 'test-password',
      db: 0,
    },
    cluster: [
      {
        host: 'localhost',
        port: 7000,
        password: 'cluster-password',
      },
      {
        host: 'localhost',
        port: 7001,
        password: 'cluster-password',
      },
    ],
    sentinel: {
      sentinels: [],
      name: 'master',
      password: '',
      db: 0,
    },
  };

  return {
    RedisConfig: jest.fn<any>().mockResolvedValue(mockStandaloneConfig),
    mockStandaloneConfig,
    mockClusterConfig,
  };
});

describe('RedisUtility', () => {
  let mockLoggerLog: jest.SpiedFunction<typeof Logger.log>;
  let mockLoggerWarn: jest.SpiedFunction<typeof Logger.warn>;
  let mockLoggerError: jest.SpiedFunction<typeof Logger.error>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerLog = jest.spyOn(Logger, 'log').mockImplementation(() => {});
    mockLoggerWarn = jest.spyOn(Logger, 'warn').mockImplementation(() => {});
    mockLoggerError = jest.spyOn(Logger, 'error').mockImplementation(() => {});

    // 重置单例状态
    (RedisUtility as any)._instance = null;
    (RedisUtility as any).initializing = null;
    (RedisUtility as any).isClosed = false;
  });

  afterEach(async () => {
    // 清理连接
    if (RedisUtility.isConnected()) {
      await RedisUtility.close();
    }
    jest.restoreAllMocks();
  });

  describe('client', () => {
    it('应该创建单机模式的 Redis 客户端', async () => {
      // Act
      const client = await RedisUtility.client();

      // Assert
      expect(client).toBeDefined();
      expect(RedisUtility.isConnected()).toBe(true);
    });

    it('应该缓存客户端实例，避免重复创建', async () => {
      // Act
      const client1 = await RedisUtility.client();
      const client2 = await RedisUtility.client();

      // Assert
      expect(client1).toBe(client2);
    });

    it('应该支持并发初始化，防止重复创建', async () => {
      // Act
      const [client1, client2, client3] = await Promise.all([
        RedisUtility.client(),
        RedisUtility.client(),
        RedisUtility.client(),
      ]);

      // Assert
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('应该在连接建立后设置事件监听', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();

      // Act
      await RedisUtility.client();

      // Assert
      expect(mockClient.on).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith(
        'reconnecting',
        expect.any(Function),
      );
      expect(mockClient.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('应该在配置错误时抛出友好的错误消息', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'standalone',
        standalone: {
          host: '', // 无效的主机地址
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow(
        'Redis 主机地址不能为空',
      );
    });

    it('应该在端口无效时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'standalone',
        standalone: {
          host: 'localhost',
          port: 70000, // 无效的端口
          password: 'test-password',
          db: 0,
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow('Redis 端口无效');
    });

    it('应该在数据库编号无效时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'standalone',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 20, // 无效的数据库编号
        },
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow(
        'Redis 数据库编号无效',
      );
    });

    it('应该在集群模式配置无效时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [], // 空的集群节点
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow(
        '集群模式需要配置至少一个集群节点',
      );
    });

    it('应该在关闭后重新创建连接', async () => {
      // Arrange
      const client1 = await RedisUtility.client();
      await RedisUtility.close();

      // Act
      const client2 = await RedisUtility.client();

      // Assert
      expect(client1).not.toBe(client2);
      expect(RedisUtility.isConnected()).toBe(true);
    });
  });

  describe('instance', () => {
    it('应该在已初始化后返回实例', async () => {
      // Arrange
      await RedisUtility.client();

      // Act
      const instance = RedisUtility.instance;

      // Assert
      expect(instance).toBeDefined();
    });

    it('应该在未初始化时抛出错误', () => {
      // Act & Assert
      expect(() => RedisUtility.instance).toThrow(
        'Redis 实例未初始化。请先调用 RedisUtility.client() 方法完成初始化。',
      );
    });
  });

  describe('close', () => {
    it('应该关闭 Redis 连接', async () => {
      // Arrange
      const client = await RedisUtility.client();
      const quitSpy = jest.spyOn(client, 'quit').mockResolvedValue('OK');

      // Act
      await RedisUtility.close();

      // Assert
      expect(quitSpy).toHaveBeenCalled();
      expect(RedisUtility.isConnected()).toBe(false);
    });

    it('应该在连接已关闭时不会抛出错误', async () => {
      // Arrange
      await RedisUtility.close();

      // Act & Assert
      await expect(RedisUtility.close()).resolves.not.toThrow();
    });

    it('应该在关闭失败时记录错误但不抛出', async () => {
      // Arrange
      const client = await RedisUtility.client();
      const error = new Error('关闭连接失败');
      jest.spyOn(client, 'quit').mockRejectedValue(error);

      // Act
      await RedisUtility.close();

      // Assert
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('关闭 Redis 连接失败'),
        expect.any(String),
        'RedisUtility',
      );
      expect(RedisUtility.isConnected()).toBe(false);
    });
  });

  describe('isConnected', () => {
    it('应该在未初始化时返回 false', () => {
      // Act
      const isConnected = RedisUtility.isConnected();

      // Assert
      expect(isConnected).toBe(false);
    });

    it('应该在已初始化时返回 true', async () => {
      // Arrange
      await RedisUtility.client();

      // Act
      const isConnected = RedisUtility.isConnected();

      // Assert
      expect(isConnected).toBe(true);
    });

    it('应该在关闭后返回 false', async () => {
      // Arrange
      await RedisUtility.client();
      await RedisUtility.close();

      // Act
      const isConnected = RedisUtility.isConnected();

      // Assert
      expect(isConnected).toBe(false);
    });
  });

  describe('事件监听', () => {
    it('应该在连接建立时记录日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const connectHandler = jest.fn();
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'connect') {
          connectHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      connectHandler();

      // Assert
      expect(mockLoggerLog).toHaveBeenCalledWith('Redis 连接已建立');
    });

    it('应该在连接就绪时记录日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const readyHandler = jest.fn();
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'ready') {
          readyHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      readyHandler();

      // Assert
      expect(mockLoggerLog).toHaveBeenCalledWith('Redis 客户端已就绪');
    });

    it('应该在连接错误时记录错误日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const errorHandler = jest.fn();
      const error = new Error('连接错误');
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'error') {
          errorHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      errorHandler(error);

      // Assert
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Redis 连接错误'),
        expect.any(String),
        'RedisUtility',
      );
    });

    it('应该在连接关闭时记录警告日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const closeHandler = jest.fn();
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'close') {
          closeHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      closeHandler();

      // Assert
      expect(mockLoggerWarn).toHaveBeenCalledWith('Redis 连接已关闭');
    });

    it('应该在重连时记录日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const reconnectingHandler = jest.fn();
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'reconnecting') {
          reconnectingHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      reconnectingHandler(1000);

      // Assert
      expect(mockLoggerLog).toHaveBeenCalledWith(
        'Redis 正在重连，延迟: 1000ms',
      );
    });

    it('应该在连接结束时记录日志', async () => {
      // Arrange
      const Redis = (await import('ioredis')).default;
      const mockClient = new Redis();
      const endHandler = jest.fn();
      (mockClient.on as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'end') {
          endHandler.mockImplementation(handler);
        }
      });

      // Act
      await RedisUtility.client();
      endHandler();

      // Assert
      expect(mockLoggerLog).toHaveBeenCalledWith('Redis 连接已结束');
    });
  });

  describe('配置验证', () => {
    it('应该在配置为空时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce(null);

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow('Redis 配置不能为空');
    });

    it('应该在单机模式缺少 standalone 配置时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'standalone',
        standalone: null,
        cluster: [],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow(
        '单机模式需要配置 standalone 配置项',
      );
    });

    it('应该在集群节点主机地址为空时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [
          {
            host: '', // 空的主机地址
            port: 7000,
            password: 'cluster-password',
          },
        ],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow(
        '集群节点主机地址不能为空',
      );
    });

    it('应该在集群节点端口无效时抛出错误', async () => {
      // Arrange
      const { RedisConfig } = await import('@hl8/config');
      (RedisConfig as jest.Mock).mockResolvedValueOnce({
        mode: 'cluster',
        standalone: {
          host: 'localhost',
          port: 6379,
          password: 'test-password',
          db: 0,
        },
        cluster: [
          {
            host: 'localhost',
            port: 0, // 无效的端口
            password: 'cluster-password',
          },
        ],
        sentinel: {
          sentinels: [],
          name: 'master',
          password: '',
          db: 0,
        },
      });

      // Act & Assert
      await expect(RedisUtility.client()).rejects.toThrow('集群节点端口无效');
    });
  });
});
