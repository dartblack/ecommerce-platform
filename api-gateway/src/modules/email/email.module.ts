import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailConfig, EmailService } from './email.service';
import * as path from 'path';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const emailConfig = configService.get<EmailConfig>('email');

        const templateDir = path.join(
          process.cwd(),
          'dist',
          'modules',
          'email',
          'templates',
        );

        return {
          transport: {
            host: emailConfig?.host,
            port: emailConfig?.port,
            secure: emailConfig?.secure,
          },
          defaults: {
            from: `"${emailConfig?.from.name}" <${emailConfig?.from.address}>`,
          },
          preview: false,
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter({
              formatCurrency: (value: number | string) => {
                const numValue =
                  typeof value === 'string' ? parseFloat(value) : value;
                if (isNaN(numValue)) return '0.00';
                return numValue.toFixed(2);
              },
              formatDate: (date: Date) => {
                if (!date) return '';
                const d = new Date(date);
                return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
              },
            }),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
