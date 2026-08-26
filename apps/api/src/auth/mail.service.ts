import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST') || process.env.SMTP_HOST;
    const port = Number(this.configService.get<number>('SMTP_PORT') || process.env.SMTP_PORT) || 587;
    const user = this.configService.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass = this.configService.get<string>('SMTP_PASS') || process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`MailService initialized with SMTP host: ${host}`);
    } else {
      this.logger.warn('No SMTP configuration provided in env. Code will be logged and returned safely.');
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetCode: string, recipientName: string = 'المدير') {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      process.env.SMTP_FROM ||
      '"FASHION STORE" <noreply@craftwear.com>';

    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px; color: #111827;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #d97706; margin-top: 0; font-size: 22px; font-weight: bold;">طلب استعادة كلمة المرور</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
            مرحباً <strong>${recipientName}</strong>،<br>
            لقد تم طلب كود استعادة كلمة المرور لحسابك في لوحة تحكم المتجر.
          </p>
          <div style="background: #fef3c7; border: 1px dashed #f59e0b; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 6px 0; font-size: 12px; color: #92400e; font-weight: bold;">كود التحقق الخاص بك (صالح لمدة 15 دقيقة):</p>
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #78350f; font-family: monospace;">${resetCode}</span>
          </div>
          <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
            إذا لم تكن أنت من قام بهذا الطلب، يمكنك تجاهل هذا البريد بأمان.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} Fashion Store Platform. All rights reserved.
          </p>
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to: toEmail,
          subject: '🔐 رمز استعادة كلمة المرور - لوحة التحكم',
          text: `رمز استعادة كلمة المرور الخاص بك هو: ${resetCode}`,
          html: htmlContent,
        });
        this.logger.log(`Password reset email sent to ${toEmail}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        this.logger.error(`Failed to send email to ${toEmail}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`[PASSWORD RESET] Code for ${toEmail}: ${resetCode}`);
    return { success: false, reason: 'No SMTP configured' };
  }
}
