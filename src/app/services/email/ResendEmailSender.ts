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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; line-height: 1.5;">
        <h1 style="font-size: 22px; margin-bottom: 12px;">Restablecé tu contraseña</h1>
        <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta de rituo.</p>
        <p>Este link vence pronto y solo se puede usar una vez.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #111A3A; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700;">
            Cambiar contraseña
          </a>
        </p>
        <p>Si no pediste este cambio, podés ignorar este email.</p>
      </div>
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
