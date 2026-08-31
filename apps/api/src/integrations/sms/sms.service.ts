import { logger } from '../../common/logger/logger.js';
import type { Env } from '../../config/env.js';
import { Msg91SmsProvider } from './msg91.provider.js';
import { TwilioSmsProvider } from './twilio.provider.js';
import type { SmsProvider } from './sms-provider.js';

export class SmsService {
  private readonly provider: SmsProvider | null;

  constructor(private readonly env: Env) {
    if (env.smsProvider === 'msg91' && env.msg91AuthKey) {
      this.provider = new Msg91SmsProvider(
        env.msg91AuthKey,
        env.msg91TemplateId ?? '',
        env.msg91SenderId ?? 'NIDAVL',
      );
    } else if (
      env.smsProvider === 'twilio' &&
      env.twilioAccountSid &&
      env.twilioAuthToken &&
      env.twilioFromNumber
    ) {
      this.provider = new TwilioSmsProvider(
        env.twilioAccountSid,
        env.twilioAuthToken,
        env.twilioFromNumber,
      );
    } else {
      this.provider = null;
    }
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (this.env.smsDemoMode || !this.provider) {
      logger.info({ phone, code }, 'SMS demo mode — OTP logged (not sent)');
      return;
    }
    await this.provider.sendOtp(phone, code);
  }
}
