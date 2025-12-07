import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Mailer 配置模块
 *
 * 配置 @nestjs-modules/mailer 模块，提供邮件发送功能。
 * 从环境变量中读取邮件服务器配置。
 *
 * @class MailerConfigModule
 * @description 邮件发送服务配置模块
 */
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailHost = configService.getOrThrow<string>('MAIL_HOST');
        const mailPort = configService.get<number>('MAIL_PORT') || 587;
        const mailUsername = configService.getOrThrow<string>('MAIL_USERNAME');
        const mailPassword = configService.getOrThrow<string>('MAIL_PASSWORD');
        const mailSecure = configService.get<boolean>('MAIL_SECURE') || false;

        return {
          transport: {
            host: mailHost,
            port: mailPort,
            secure: mailSecure, // true for 465, false for other ports
            auth: {
              user: mailUsername,
              pass: mailPassword,
            },
          },
          defaults: {
            from: `"HL8 Platform" <${mailUsername}>`,
          },
        };
      },
    }),
  ],
  exports: [MailerModule],
})
export class MailerConfigModule {}
