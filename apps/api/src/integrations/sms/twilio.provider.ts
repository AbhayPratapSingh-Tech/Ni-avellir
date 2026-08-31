import { logger } from '../../common/logger/logger.js';
import type { SmsProvider } from './sms-provider.js';

export class TwilioSmsProvider implements SmsProvider {
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly fromNumber: string,
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const to = phone.startsWith('+') ? phone : `+91${phone}`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: to,
      From: this.fromNumber,
      Body: `Your Niðavellir verification code is ${code}. Valid for 10 minutes.`,
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, 'Twilio SMS failed');
      throw new Error('Failed to send SMS');
    }
  }
}
