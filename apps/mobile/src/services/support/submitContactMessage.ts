import { appConfig } from '../../config/appConfig';
import { postToAppsScript } from './postToAppsScript';

export type ContactMessagePayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export async function submitContactMessage(payload: ContactMessagePayload): Promise<void> {
  const url = appConfig.contactFormWebhookUrl.trim();
  if (!url) {
    throw new Error('Contact form is not configured yet. Paste contactFormWebhookUrl in appConfig.');
  }

  await postToAppsScript(
    url,
    {
      ...payload,
      source: 'nidavellir-mobile-contact',
      createdAt: new Date().toISOString(),
    },
    'Contact',
  );
}
