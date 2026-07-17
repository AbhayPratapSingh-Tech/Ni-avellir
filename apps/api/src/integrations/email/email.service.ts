import type { EmailProvider, SendEmailInput } from './email-provider.js';

export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  send(input: SendEmailInput): Promise<void> {
    return this.provider.send(input);
  }
}
