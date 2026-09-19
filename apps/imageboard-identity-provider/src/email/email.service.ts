import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mustache from 'mustache';
import * as nodemailer from 'nodemailer'

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.transporter = nodemailer.createTransport({
      host: configService.getOrThrow<string>('SMTP_HOST'),
      port: Number(configService.getOrThrow<string>('SMTP_PORT')),
      // Implicit TLS by default; set SMTP_SECURE=false for plain-SMTP catchers (Mailpit).
      secure: configService.get<string>('SMTP_SECURE') !== 'false',
      auth: {
        user: configService.getOrThrow<string>('SMTP_USER'),
        pass: configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async send(mailOptions: nodemailer.SendMailOptions) {
    await this.transporter.sendMail({ from: this.configService.getOrThrow<string>('SMTP_FROM'), ...mailOptions });
  }

  async sendFromTemplate(template: string, variables: Record<string, unknown>, mailOptions: nodemailer.SendMailOptions) {
    await this.send({
      ...mailOptions,
      html: Mustache.render(template, variables),
    })
  }
}