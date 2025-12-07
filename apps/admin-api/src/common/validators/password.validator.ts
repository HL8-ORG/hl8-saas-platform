import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * 强密码验证装饰器
 *
 * 用于验证密码是否符合强密码要求。
 *
 * **密码要求**：
 * - 至少 8 个字符
 * - 至少一个大写字母（A-Z）
 * - 至少一个小写字母（a-z）
 * - 至少一个数字（0-9）
 * - 至少一个特殊字符（!@#$%^&*()_+-=[]{};':"\\|,.<>/?）
 *
 * @function IsStrongPassword
 * @param {ValidationOptions} [validationOptions] - 可选的验证选项
 * @returns {Function} 类属性装饰器函数
 *
 * @example
 * ```typescript
 * class LoginDto {
 *   @IsStrongPassword()
 *   password: string;
 * }
 * ```
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          // At least 8 characters
          if (value.length < 8) return false;

          // At least one uppercase letter
          if (!/[A-Z]/.test(value)) return false;

          // At least one lowercase letter
          if (!/[a-z]/.test(value)) return false;

          // At least one number
          if (!/[0-9]/.test(value)) return false;

          // At least one special character
          if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false;

          return true;
        },
        defaultMessage() {
          return 'Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character';
        },
      },
    });
  };
}
