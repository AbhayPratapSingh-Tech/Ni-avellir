import { digitsOnly } from '../../lib/addressValidation';
import { getCategoryConfig } from './supportCategories';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

export type ContactFormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

export function emptyContactFromUser(user: {
  name?: string;
  email?: string;
  phone?: string;
  isGuest?: boolean;
} | null): ContactFormState {
  if (!user || user.isGuest) {
    return { name: '', email: '', phone: '', message: '' };
  }
  return {
    name: user.name || '',
    email: user.email || '',
    phone: digitsOnly(user.phone || ''),
    message: '',
  };
}

export function validateContactForm(form: ContactFormState): ContactFormErrors {
  const errors: ContactFormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = digitsOnly(form.phone);
  const message = form.message.trim();

  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Enter at least 2 characters';
  else if (!NAME_RE.test(name)) errors.name = "Use letters only (spaces, . ' - allowed)";

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone number is required';
  else if (phone.length !== 10) errors.phone = 'Enter a valid 10-digit mobile number';
  else if (!INDIAN_MOBILE_RE.test(phone)) errors.phone = 'Mobile number must start with 6–9';

  if (!message) errors.message = 'Please write your message';
  else if (message.length < 10) errors.message = 'Add a bit more detail (at least 10 characters)';
  else if (message.length > 1000) errors.message = 'Message is too long (max 1000 characters)';

  return errors;
}

export type SupportFormState = {
  name: string;
  email: string;
  phone: string;
  category: string;
  subcategory: string;
  orderId: string;
  productSku: string;
  orderDate: string;
  affectedProduct: string;
  paymentMode: string;
  transactionId: string;
  paymentAmount: string;
  paymentDate: string;
  awb: string;
  expectedDate: string;
  deliveryAddress: string;
  returnProduct: string;
  returnRequestId: string;
  refundAmount: string;
  refundReference: string;
  registeredMobile: string;
  registeredEmail: string;
  pageUrl: string;
  errorMessage: string;
  device: string;
  couponCode: string;
  comments: string;
};

export type SupportFormErrors = Partial<Record<keyof SupportFormState, string>>;

const EMPTY_EXTRAS: Omit<SupportFormState, 'name' | 'email' | 'phone' | 'category' | 'orderId' | 'comments'> =
  {
    subcategory: '',
    productSku: '',
    orderDate: '',
    affectedProduct: '',
    paymentMode: '',
    transactionId: '',
    paymentAmount: '',
    paymentDate: '',
    awb: '',
    expectedDate: '',
    deliveryAddress: '',
    returnProduct: '',
    returnRequestId: '',
    refundAmount: '',
    refundReference: '',
    registeredMobile: '',
    registeredEmail: '',
    pageUrl: '',
    errorMessage: '',
    device: '',
    couponCode: '',
  };

export function emptySupportFromUser(
  user: {
    name?: string;
    email?: string;
    phone?: string;
    isGuest?: boolean;
  } | null,
  prefs?: { category?: string; orderId?: string },
): SupportFormState {
  const phone = user && !user.isGuest ? digitsOnly(user.phone || '') : '';
  const email = user && !user.isGuest ? user.email || '' : '';
  return {
    name: user && !user.isGuest ? user.name || '' : '',
    email,
    phone,
    category: prefs?.category || '',
    orderId: prefs?.orderId || '',
    comments: '',
    ...EMPTY_EXTRAS,
    registeredMobile: phone,
    registeredEmail: email,
  };
}

export function validateSupportForm(form: SupportFormState): SupportFormErrors {
  const errors: SupportFormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = digitsOnly(form.phone);
  const comments = form.comments.trim();
  const config = getCategoryConfig(form.category);

  if (!name) errors.name = 'Name is required';
  else if (name.length < 2) errors.name = 'Enter at least 2 characters';
  else if (!NAME_RE.test(name)) errors.name = "Use letters only (spaces, . ' - allowed)";

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone number is required';
  else if (phone.length !== 10) errors.phone = 'Enter a valid 10-digit mobile number';
  else if (!INDIAN_MOBILE_RE.test(phone)) errors.phone = 'Mobile number must start with 6–9';

  if (!form.category.trim()) errors.category = 'Select a query category';
  else if (config && config.subs.length > 0 && !form.subcategory.trim()) {
    errors.subcategory = 'Select a subcategory';
  }

  if (config?.fields.includes('registeredMobile')) {
    const regPhone = digitsOnly(form.registeredMobile);
    if (!regPhone) errors.registeredMobile = 'Registered mobile is required';
    else if (regPhone.length !== 10 || !INDIAN_MOBILE_RE.test(regPhone)) {
      errors.registeredMobile = 'Enter a valid 10-digit mobile';
    }
  }
  if (config?.fields.includes('registeredEmail')) {
    const regEmail = form.registeredEmail.trim();
    if (!regEmail) errors.registeredEmail = 'Registered email is required';
    else if (!EMAIL_RE.test(regEmail)) errors.registeredEmail = 'Enter a valid email';
  }

  if (!comments) errors.comments = 'Please write your query';
  else if (comments.length < 10) errors.comments = 'Add a bit more detail (at least 10 characters)';
  else if (comments.length > 1000) errors.comments = 'Query is too long (max 1000 characters)';

  return errors;
}

/** Extra context lines appended into Comments for the existing Sheet layout. */
export function formatSupportExtraDetails(form: SupportFormState): string {
  const config = getCategoryConfig(form.category);
  if (!config) return '';

  const lines: string[] = [];
  const push = (label: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed) lines.push(`${label}: ${trimmed}`);
  };

  for (const field of config.fields) {
    if (field === 'order') continue; // already in OrderId column
    if (field === 'productSku') continue; // already in ProductSku column
    switch (field) {
      case 'orderDate':
        push('Order date', form.orderDate);
        break;
      case 'affectedProduct':
        push('Product SKU', form.affectedProduct);
        break;
      case 'paymentMode':
        push('Payment mode', form.paymentMode);
        break;
      case 'transactionId':
        push('Transaction ID', form.transactionId);
        break;
      case 'paymentAmount':
        push('Payment amount', form.paymentAmount);
        break;
      case 'paymentDate':
        push('Payment date', form.paymentDate);
        break;
      case 'awb':
        push('AWB / tracking', form.awb);
        break;
      case 'expectedDate':
        push('Expected delivery', form.expectedDate);
        break;
      case 'deliveryAddress':
        push('Delivery address', form.deliveryAddress);
        break;
      case 'returnProduct':
        push('Return product', form.returnProduct);
        break;
      case 'returnRequestId':
        push('Return request ID', form.returnRequestId);
        break;
      case 'refundAmount':
        push('Refund amount', form.refundAmount);
        break;
      case 'refundReference':
        push('Refund reference', form.refundReference);
        break;
      case 'registeredMobile':
        push('Registered mobile', form.registeredMobile);
        break;
      case 'registeredEmail':
        push('Registered email', form.registeredEmail);
        break;
      case 'pageUrl':
        push('Screen / page', form.pageUrl);
        break;
      case 'errorMessage':
        push('Error message', form.errorMessage);
        break;
      case 'device':
        push('Device', form.device);
        break;
      case 'couponCode':
        push('Coupon', form.couponCode);
        break;
      default:
        break;
    }
  }

  return lines.join('\n');
}
