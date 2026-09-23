import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mustache from 'mustache';
import * as nodemailer from 'nodemailer'

import type { AppConfig } from '@hdotu1/config';

type SmtpConfig = AppConfig['identityProvider']['smtp'];

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService
  ) {
    const smtp = configService.getOrThrow<SmtpConfig>('identityProvider.smtp');

    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: configService.getOrThrow<string>('secrets.SMTP_USER'),
        pass: configService.getOrThrow<string>('secrets.SMTP_PASS'),
      },
    });
  }

  async send(mailOptions: nodemailer.SendMailOptions) {
    await this.transporter.sendMail({ from: this.configService.getOrThrow<string>('identityProvider.smtp.from'), ...mailOptions });
  }

  async sendFromTemplate(template: string, variables: Record<string, unknown>, mailOptions: nodemailer.SendMailOptions) {
    await this.send({
      ...mailOptions,
      html: Mustache.render(template, variables),
    })
  }
}