/**
 * @hl8/mail 模块的 Jest Mock
 *
 * 用于测试中模拟邮件服务，避免实际发送邮件。
 */

/**
 * 邮件服务 Mock
 */
export const MailService = jest.fn().mockImplementation(() => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

/**
 * 注册成功邮件模板 Mock
 */
export const RegisterSuccessMail = jest.fn().mockImplementation((params) => {
  return `<html><body>Mock email template for ${params.name}</body></html>`;
});

/**
 * 邮件配置 Token Mock
 */
export const MAIL_CONFIG = Symbol('MAIL_CONFIG');

/**
 * 邮件模块 Mock
 */
export const MailModule = {
  forRoot: jest.fn().mockReturnValue({
    module: class MockMailModule {},
    providers: [],
    exports: [MailService],
    global: true,
  }),
};

/**
 * MailConfig 类型 Mock
 */
export type MailConfig = {
  readonly MAIL_USERNAME: string;
  readonly APP_NAME?: string;
  readonly APP_URL?: string;
};
