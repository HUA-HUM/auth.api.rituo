export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface SendPasswordResetEmailData {
  to: string;
  resetUrl: string;
}

export interface SendEmailVerificationEmailData {
  to: string;
  verifyUrl: string;
}

export interface IEmailSender {
  sendPasswordResetEmail(data: SendPasswordResetEmailData): Promise<void>;
  sendEmailVerificationEmail(
    data: SendEmailVerificationEmailData,
  ): Promise<void>;
}
