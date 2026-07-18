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
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
          <title>Restablecé tu contraseña de rituo</title>
        </head>
        <body style="margin:0;padding:0;background:#eef3fb;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#eef3fb;margin:0;padding:0;">
            <tr>
              <td align="center" style="padding:32px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;border-collapse:separate;border-spacing:0;">
                  <tr>
                    <td align="center" style="padding:0 0 18px;">
                      <div style="font-size:34px;line-height:1;font-weight:650;letter-spacing:-0.08em;color:#111827;">
                        rituo<span style="display:inline-block;width:6px;height:6px;margin-left:3px;margin-bottom:21px;border-radius:999px;background:#111827;vertical-align:middle;"></span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border:1px solid #d9e2ef;border-radius:28px;background:#ffffff;box-shadow:0 18px 54px rgba(13,21,40,0.12);padding:32px 28px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
                        <tr>
                          <td>
                            <div style="display:inline-block;margin:0 0 18px;padding:7px 13px;border-radius:999px;border:1px solid #d8e1ec;background:#f6f8fc;color:#66758a;font-size:10px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">
                              Recuperación de cuenta
                            </div>
                          </td>
                        </tr>
                      </table>

                      <h1 style="margin:0;color:#111827;font-size:31px;line-height:1.08;font-weight:850;letter-spacing:-0.04em;">
                        Cambiá tu contraseña
                      </h1>

                      <p style="margin:16px 0 0;color:#4b5565;font-size:16px;line-height:1.62;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta de rituo.
                      </p>

                      <p style="margin:8px 0 0;color:#66758a;font-size:14px;line-height:1.58;">
                        El link vence pronto y solo se puede usar una vez.
                      </p>

                      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 22px;">
                        <tr>
                          <td>
                            <a href="${resetUrl}" style="display:inline-block;background:#111a3a;color:#ffffff;padding:15px 24px;border-radius:999px;text-decoration:none;font-size:15px;font-weight:850;box-shadow:0 12px 28px rgba(17,26,58,0.22);">
                              Cambiar contraseña
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;margin:0;">
                        <tr>
                          <td style="padding:15px 16px;border-radius:18px;background:#f6f8fc;border:1px solid #e2e8f0;">
                            <p style="margin:0;color:#5d6b7c;font-size:13px;line-height:1.55;">
                              Si el botón no funciona, copiá y pegá este link en el navegador:
                            </p>
                            <p style="margin:8px 0 0;color:#111827;font-size:12px;line-height:1.55;word-break:break-all;">
                              ${resetUrl}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;margin:14px 0 0;">
                        <tr>
                          <td style="padding:14px 16px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;">
                            <p style="margin:0;color:#7c4a1f;font-size:13px;line-height:1.55;">
                          Si no pediste este cambio, podés ignorar este email. Tu contraseña actual seguirá funcionando.
                        </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:18px 18px 0;">
                      <p style="margin:0;color:#7b8798;font-size:12px;line-height:1.5;">
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
