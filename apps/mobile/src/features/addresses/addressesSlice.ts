import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';

export type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault?: boolean;
};

export type AddressInput = Omit<SavedAddress, 'id' | 'isDefault'> & {
  id?: string;
  isDefault?: boolean;
};

type AddressesState = {
  items: SavedAddress[];
};

const initialState: AddressesState = {
  items: [],
};

function sameAddress(a: AddressInput, b: SavedAddress) {
  return (
    a.fullName.trim().toLowerCase() === b.fullName.trim().toLowerCase() &&
    a.phone.replace(/\D/g, '') === b.phone.replace(/\D/g, '') &&
    a.line1.trim().toLowerCase() === b.line1.trim().toLowerCase() &&
    a.city.trim().toLowerCase() === b.city.trim().toLowerCase() &&
    a.state.trim().toLowerCase() === b.state.trim().toLowerCase() &&
    a.postalCode.replace(/\D/g, '') === b.postalCode.replace(/\D/g, '')
  );
}

const addressesSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    upsertAddress(state, action: PayloadAction<AddressInput>) {
      const payload = action.payload;
      if (payload.id) {
        const index = state.items.findIndex((item) => item.id === payload.id);
        const current = index >= 0 ? state.items[index] : undefined;
        if (current) {
          const next: SavedAddress = {
            id: payload.id,
            fullName: payload.fullName.trim(),
            phone: payload.phone.replace(/\D/g, ''),
            line1: payload.line1.trim(),
            city: payload.city.trim(),
            state: payload.state.trim(),
            postalCode: payload.postalCode.replace(/\D/g, ''),
            isDefault: payload.isDefault ?? current.isDefault,
          };
          if (next.isDefault) {
            state.items.forEach((item) => {
              item.isDefault = item.id === next.id;
            });
          }
          state.items[index] = next;
          return;
        }
      }

      const existing = state.items.find((item) => sameAddress(payload, item));
      if (existing) {
        if (payload.isDefault) {
          state.items.forEach((item) => {
            item.isDefault = item.id === existing.id;
          });
        }
        return;
      }

      const id = payload.id ?? nanoid();
      const makeDefault = payload.isDefault || state.items.length === 0;
      if (makeDefault) {
        state.items.forEach((item) => {
          item.isDefault = false;
        });
      }
      state.items.unshift({
        id,
        fullName: payload.fullName.trim(),
        phone: payload.phone.replace(/\D/g, ''),
        line1: payload.line1.trim(),
        city: payload.city.trim(),
        state: payload.state.trim(),
        postalCode: payload.postalCode.replace(/\D/g, ''),
        isDefault: makeDefault,
      });
    },
    updateAddress(state, action: PayloadAction<SavedAddress>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index < 0) return;
      const next = { ...action.payload };
      if (next.isDefault) {
        state.items.forEach((item) => {
          item.isDefault = item.id === next.id;
        });
      }
      state.items[index] = next;
    },
    deleteAddress(state, action: PayloadAction<string>) {
      const wasDefault = state.items.find((item) => item.id === action.payload)?.isDefault;
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (wasDefault && state.items[0]) {
        state.items[0].isDefault = true;
      }
    },
    setDefaultAddress(state, action: PayloadAction<string>) {
      state.items.forEach((item) => {
        item.isDefault = item.id === action.payload;
      });
    },
    setAddresses(state, action: PayloadAction<SavedAddress[]>) {
      state.items = action.payload;
    },
  },
});

export const { upsertAddress, updateAddress, deleteAddress, setDefaultAddress, setAddresses } =
  addressesSlice.actions;
export const addressesReducer = addressesSlice.reducer;
