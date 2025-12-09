/**
 * @hl8/mail Mock
 *
 * 用于单元测试的 MailService mock。
 */
export class MailService {
  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    // Mock implementation
  }
}
