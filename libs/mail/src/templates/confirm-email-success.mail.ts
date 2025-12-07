/**
 * 邮箱确认成功邮件模板。
 *
 * @description 生成邮箱确认成功通知邮件 HTML 内容。
 * 用于通知用户邮箱验证操作已成功完成。
 *
 * @param {Object} params - 模板参数对象。
 * @param {string} params.name - 用户姓名或用户名。
 * @param {string} [params.appName='HL8 Platform'] - 应用名称，用于邮件中的品牌显示。
 * @param {string} [params.appUrl='https://example.com'] - 应用 URL，用于邮件中的链接和资源引用。
 * @returns {string} 邮件 HTML 内容。
 *
 * @example
 * ```typescript
 * const html = ConfirmEmailSuccessMail({
 *   name: '张三',
 *   appName: 'My App',
 *   appUrl: 'https://myapp.com',
 * });
 * await mailService.sendEmail({
 *   to: ['user@example.com'],
 *   subject: '邮箱验证成功',
 *   html,
 * });
 * ```
 */
export const ConfirmEmailSuccessMail = ({
  name,
  appName = 'HL8 Platform',
  appUrl = 'https://example.com',
}: {
  name: string;
  appName?: string;
  appUrl?: string;
}) => {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Confirmed</title>
</head>
<body style="background-color:#efeff1;margin:0;padding:0;">
<div style="max-width:580px;margin:30px auto;background:#fff;padding:30px;">
  <div style="text-align:center;margin-bottom:20px;">
        <img src="${appUrl}/assets/logo/icon.svg" alt="${appName}" width="50" height="50" style="display:block;margin:0 auto;" />
  </div>

  <hr style="border:none;border-top:1px solid #9147ff;margin:20px 0;" />

  <h4 style="margin:0 0 16px;">Hi, ${name}</h4>

  <p style="font-size:14px;line-height:1.5;color:#333;margin:16px 0;">
    Your email address for <strong>${appName}</strong> has been successfully confirmed.
  </p>

  <p style="font-size:14px;line-height:1.5;color:#333;margin:16px 0;text-align:center;">
    Your action has been successfully confirmed.
  </p>

  <p style="font-size:14px;line-height:1.5;color:#333;margin:16px 0;">
    If you didn't request this confirmation, please contact support immediately.
  </p>

  <p style="font-size:14px;line-height:1.5;margin:16px 0;">
    Thanks,<br />
    ${appName} Support Team
  </p>
</div>

<footer style="text-align:center;font-size:14px;color:#706a7b;margin:16px auto;">
  © ${new Date().getFullYear()} ${appName}, All Rights Reserved.
</footer>
</body>
</html>
`;
};
