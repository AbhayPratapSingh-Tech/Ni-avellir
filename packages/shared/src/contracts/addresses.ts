export type SavedAddressDto = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
};

export type AddressListResponse = {
  addresses: SavedAddressDto[];
};
