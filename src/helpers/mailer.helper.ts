import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import Email from 'email-templates';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: Number.parseInt(this.configService.getOrThrow<string>('MAIL_PORT')),
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USERNAME'),
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async onModuleInit() {
    await this.transporter.verify();
    console.log('SMTP connection ready');
  }

  async sendMail(
    to: string | string[],
    subject: string,
    tplName: string,
    locals: any,
  ): Promise<boolean> {
    const templateDir = join(
      __dirname,
      '..',
      '..',
      'views',
      'email-templates',
      tplName,
      'html',
    );

    const email = new Email({
      views: {
        root: templateDir,
        options: {
          extension: 'ejs',
        },
      },
    });

    const getMailBody = await email.render(templateDir, locals);

    const mailOptions = {
      from: `${this.configService.get('MAIL_FROM_NAME') ?? 'AI Chat'} <${this.configService.get('MAIL_FROM_ADDRESS')}>`,
      to,
      subject,
      html: getMailBody,
    };

    await this.transporter.sendMail(mailOptions);
    return true;
  }
}
