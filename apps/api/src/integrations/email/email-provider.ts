export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type EmailProvider = {
  readonly code: string;
  send(input: SendEmailInput): Promise<void>;
};
