import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  IEmailSender,
  SendPasswordResetEmailData,
} from '../../../core/adapters/services/email/IEmailSender';
import { env } from '../../../config/env';

@Injectable()
export class ResendEmailSender implements IEmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly resend = new Resend(env.resendApiKey);

  async sendPasswordResetEmail(
    data: SendPasswordResetEmailData,
  ): Promise<void> {
    const result = await this.resend.emails.send({
      from: env.resendFromEmail,
      to: data.to,
      subject: 'Restablecé tu contraseña de rituo',
      html: this.passwordResetHtml(data.resetUrl),
      text: this.passwordResetText(data.resetUrl),
    });

    if (result.error) {
      this.logger.error({
        event: 'password_reset_email_failed',
        to: data.to,
        error: result.error,
      });
      throw new Error('Could not send password reset email');
    }
  }

  private passwordResetHtml(resetUrl: string): string {
    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Restablecé tu contraseña de rituo</title>
        </head>
        <body style="margin:0;padding:0;background:#0d1528;color:#f0f3fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#0d1528;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:38px 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;border-collapse:separate;border-spacing:0;">
                  <tr>
                    <td align="center" style="padding:0 0 22px;">
                      <div style="font-size:34px;line-height:1;font-weight:500;letter-spacing:-0.08em;color:#ffffff;">
                        rituo<span style="display:inline-block;width:6px;height:6px;margin-left:3px;margin-bottom:21px;border-radius:999px;background:#ffffff;box-shadow:0 0 14px rgba(255,255,255,0.72);vertical-align:middle;"></span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid rgba(156,178,198,0.20);border-radius:30px;background:linear-gradient(180deg,#18233f 0%,#101933 100%);box-shadow:0 26px 70px rgba(0,0,0,0.34);padding:34px 30px;">
                      <div style="display:inline-block;margin:0 0 18px;padding:7px 14px;border-radius:999px;border:1px solid rgba(156,178,198,0.22);background:rgba(156,178,198,0.08);color:#9cb2c6;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">
                        Recuperación de cuenta
                      </div>

                      <h1 style="margin:0;color:#ffffff;font-size:32px;line-height:1.04;font-weight:850;letter-spacing:-0.045em;">
                        Cambiá tu contraseña
                      </h1>

                      <p style="margin:18px 0 0;color:rgba(240,243,250,0.72);font-size:16px;line-height:1.62;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta de rituo.
                      </p>

                      <p style="margin:10px 0 0;color:rgba(156,178,198,0.88);font-size:14px;line-height:1.58;">
                        El link vence pronto y solo se puede usar una vez.
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 24px;">
                        <tr>
                          <td>
                            <a href="${resetUrl}" style="display:inline-block;background:#f0f3fa;color:#0d1528;padding:15px 24px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:850;box-shadow:0 14px 34px rgba(0,0,0,0.28);">
                              Cambiar contraseña
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="margin:0;padding:16px;border-radius:18px;background:rgba(8,15,30,0.45);border:1px solid rgba(156,178,198,0.12);">
                        <p style="margin:0;color:rgba(240,243,250,0.70);font-size:13px;line-height:1.55;">
                          Si no pediste este cambio, podés ignorar este email. Tu contraseña actual seguirá funcionando.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:20px 18px 0;">
                      <p style="margin:0;color:rgba(156,178,198,0.58);font-size:12px;line-height:1.5;">
                        rituo · Recuperá el foco con intención.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private passwordResetText(resetUrl: string): string {
    return [
      'Restablecé tu contraseña de rituo',
      '',
      'Recibimos una solicitud para cambiar la contraseña de tu cuenta.',
      'Abrí este link para crear una nueva contraseña:',
      resetUrl,
      '',
      'Si no pediste este cambio, podés ignorar este email.',
    ].join('\n');
  }
}
