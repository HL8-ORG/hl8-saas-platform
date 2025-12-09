import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PasswordHasherService } from './password-hasher.service';

/**
 * 密码哈希服务单元测试
 *
 * 测试密码哈希服务的哈希和验证功能。
 *
 * @describe PasswordHasherService
 */
describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordHasherService],
    }).compile();

    service = module.get<PasswordHasherService>(PasswordHasherService);
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('应该成功哈希密码', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('应该为相同密码生成不同的哈希值（由于盐值）', async () => {
      const password = 'testPassword123';
      const hash1 = await service.hash(password);
      const hash2 = await service.hash(password);

      expect(hash1).not.toBe(hash2);
    });

    it('应该生成有效的 bcrypt 哈希', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);

      // bcrypt 哈希应该以 $2a$, $2b$, $2x$, 或 $2y$ 开头
      expect(hash).toMatch(/^\$2[abxy]\$/);
    });
  });

  describe('verify', () => {
    it('应该验证正确的密码', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);

      const isValid = await service.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('应该拒绝错误的密码', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await service.hash(password);

      const isValid = await service.verify(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('应该拒绝空密码', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);

      const isValid = await service.verify('', hash);

      expect(isValid).toBe(false);
    });

    it('应该拒绝无效的哈希值', async () => {
      const password = 'testPassword123';
      const invalidHash = 'invalidHash';

      const isValid = await service.verify(password, invalidHash);

      expect(isValid).toBe(false);
    });

    it('应该正确处理特殊字符密码', async () => {
      const password = 'p@ssw0rd!@#$%^&*()';
      const hash = await service.hash(password);

      const isValid = await service.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('应该正确处理长密码', async () => {
      const password = 'a'.repeat(100);
      const hash = await service.hash(password);

      const isValid = await service.verify(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('集成测试', () => {
    it('应该能够哈希并验证密码的完整流程', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);
      const isValid = await service.verify(password, hash);

      expect(isValid).toBe(true);
    });

    it('应该使用 bcrypt 进行实际哈希', async () => {
      const password = 'testPassword123';
      const hash = await service.hash(password);

      // 使用 bcrypt.compare 验证哈希是否正确生成
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });
  });
});
