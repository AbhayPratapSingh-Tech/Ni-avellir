export type StoreLocation = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  phone?: string;
  active: boolean;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};
