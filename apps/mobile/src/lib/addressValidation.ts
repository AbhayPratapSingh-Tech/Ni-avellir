export type AddressFields = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type AddressFieldErrors = Partial<Record<keyof AddressFields, string>>;

const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
const PLACE_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,49}$/;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^[1-9]\d{5}$/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function validateAddressFields(fields: AddressFields): AddressFieldErrors {
  const errors: AddressFieldErrors = {};
  const fullName = fields.fullName.trim();
  const phone = digitsOnly(fields.phone);
  const line1 = fields.line1.trim();
  const city = fields.city.trim();
  const state = fields.state.trim();
  const postalCode = digitsOnly(fields.postalCode);

  if (!fullName) {
    errors.fullName = 'Full name is required';
  } else if (fullName.length < 2) {
    errors.fullName = 'Enter at least 2 characters';
  } else if (!NAME_RE.test(fullName)) {
    errors.fullName = 'Use letters only (spaces, . \' - allowed)';
  }

  if (!phone) {
    errors.phone = 'Phone number is required';
  } else if (phone.length !== 10) {
    errors.phone = 'Enter a valid 10-digit mobile number';
  } else if (!INDIAN_MOBILE_RE.test(phone)) {
    errors.phone = 'Mobile number must start with 6–9';
  }

  if (!line1) {
    errors.line1 = 'Address is required';
  } else if (line1.length < 5) {
    errors.line1 = 'Enter a more complete street address';
  } else if (line1.length > 120) {
    errors.line1 = 'Address is too long (max 120 characters)';
  }

  if (!city) {
    errors.city = 'City is required';
  } else if (!PLACE_RE.test(city)) {
    errors.city = 'City should contain letters only';
  }

  if (!state) {
    errors.state = 'State is required';
  } else if (!PLACE_RE.test(state)) {
    errors.state = 'State should contain letters only';
  }

  if (!postalCode) {
    errors.postalCode = 'PIN code is required';
  } else if (!PIN_RE.test(postalCode)) {
    errors.postalCode = 'Enter a valid 6-digit PIN code';
  }

  return errors;
}

export function hasAddressErrors(errors: AddressFieldErrors) {
  return Object.keys(errors).length > 0;
}
