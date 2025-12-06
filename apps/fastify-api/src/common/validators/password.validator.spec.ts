import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsStrongPassword } from './password.validator';

/**
 * 测试用的 DTO 类
 */
class TestDto {
  @IsStrongPassword()
  password!: string;
}

/**
 * 密码验证器单元测试
 *
 * 测试强密码验证装饰器的验证逻辑。
 *
 * @describe IsStrongPassword
 */
describe('IsStrongPassword', () => {
  it('应该被定义', () => {
    expect(IsStrongPassword).toBeDefined();
    expect(typeof IsStrongPassword).toBe('function');
  });

  describe('密码验证', () => {
    it('应该接受符合要求的强密码', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Password123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('当密码少于 8 个字符时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Pass1!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toBeDefined();
    });

    it('当密码没有大写字母时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'password123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码没有小写字母时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'PASSWORD123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码没有数字时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Password!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码没有特殊字符时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Password123',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码不是字符串类型时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: 12345678,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码为 null 时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {
        password: null,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('当密码为 undefined 时应该拒绝', async () => {
      const dto = plainToInstance(TestDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });

    it('应该接受包含各种特殊字符的密码', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];

      for (const char of specialChars) {
        const dto = plainToInstance(TestDto, {
          password: `Password1${char}`,
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      }
    });

    it('应该接受包含下划线和连字符的密码', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Password1_',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('应该返回正确的错误消息', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'weak',
      });

      const errors = await validate(dto);

      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints?.['isStrongPassword']).toContain(
        'Password must contain at least 8 characters',
      );
    });

    it('应该接受长度为 8 的密码', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'Pass123!',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('应该接受更长的强密码', async () => {
      const dto = plainToInstance(TestDto, {
        password: 'VeryLongPassword123!@#',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
