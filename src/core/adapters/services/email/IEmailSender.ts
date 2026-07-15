export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface SendPasswordResetEmailData {
  to: string;
  resetUrl: string;
}

export interface IEmailSender {
  sendPasswordResetEmail(data: SendPasswordResetEmailData): Promise<void>;
}
