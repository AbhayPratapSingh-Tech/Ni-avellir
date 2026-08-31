import { logger } from '../../common/logger/logger.js';
import type { SmsProvider } from './sms-provider.js';

export class Msg91SmsProvider implements SmsProvider {
  constructor(
    private readonly authKey: string,
    private readonly templateId: string,
    private readonly senderId: string,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const mobile = phone.startsWith('91') ? phone : `91${phone}`;
    const url = 'https://control.msg91.com/api/v5/flow/';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: this.authKey,
      },
      body: JSON.stringify({
        template_id: this.templateId,
        short_url: '0',
        recipients: [{ mobiles: mobile, var: code, VAR: code, otp: code }],
        sender: this.senderId,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      logger.error({ status: response.status, body }, 'MSG91 SMS failed');
      throw new Error('Failed to send SMS');
    }
  }
}
