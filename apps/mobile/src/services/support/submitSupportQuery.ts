import { appConfig } from '../../config/appConfig';
import { postToAppsScript } from './postToAppsScript';

export type SupportQueryPayload = {
  name: string;
  email: string;
  phone: string;
  category: string;
  subcategory: string;
  orderId: string;
  productSku: string;
  comments: string;
  caseNumber: string;
  status: 'Pending' | 'Resolved';
  /** Extra category fields → Support Commerce / Support Account App tabs (not Comments). */
  extras?: Record<string, string>;
};

export async function submitSupportQuery(payload: SupportQueryPayload): Promise<void> {
  const url = appConfig.supportFormWebhookUrl.trim();
  if (!url) {
    throw new Error('Support form is not configured yet. Paste supportFormWebhookUrl in appConfig.');
  }

  const { extras, ...core } = payload;
  await postToAppsScript(
    url,
    {
      action: 'create',
      ...core,
      ...(extras || {}),
      source: 'nidavellir-mobile-support',
      createdAt: new Date().toISOString(),
    },
    'Support',
  );
}

/** Updates Status column on the Support sheet for an existing CaseNumber. */
export async function resolveSupportQueryOnSheet(input: {
  caseNumber: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  const url = appConfig.supportFormWebhookUrl.trim();
  if (!url) {
    throw new Error('Support form is not configured yet. Paste supportFormWebhookUrl in appConfig.');
  }

  await postToAppsScript(
    url,
    {
      action: 'resolve',
      caseNumber: input.caseNumber,
      status: 'Resolved',
      email: input.email || '',
      phone: input.phone || '',
      source: 'nidavellir-mobile-support',
      resolvedAt: new Date().toISOString(),
    },
    'Support',
  );
}
