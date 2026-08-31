import { appConfig } from '../../config/appConfig';
import { apiClient } from '../api/apiClient';
import { store } from '../../app/store';
import { setAddresses, type SavedAddress } from '../../features/addresses/addressesSlice';

function mapAddress(raw: Record<string, unknown>): SavedAddress {
  return {
    id: String(raw._id ?? raw.id),
    fullName: String(raw.fullName),
    phone: String(raw.phone),
    line1: String(raw.line1),
    city: String(raw.city),
    state: String(raw.state),
    postalCode: String(raw.postalCode),
    isDefault: Boolean(raw.isDefault),
  };
}

export const addressRepository = {
  async syncToStore() {
    if (appConfig.dataSource !== 'api') return;
    const { data } = await apiClient.get('/addresses');
    store.dispatch(setAddresses((data.data.addresses as Record<string, unknown>[]).map(mapAddress)));
  },

  async create(input: Omit<SavedAddress, 'id'>) {
    const { data } = await apiClient.post('/addresses', input);
    await this.syncToStore();
    return mapAddress(data.data.address);
  },

  async update(id: string, input: Partial<SavedAddress>) {
    await apiClient.patch(`/addresses/${id}`, input);
    await this.syncToStore();
  },

  async remove(id: string) {
    await apiClient.delete(`/addresses/${id}`);
    await this.syncToStore();
  },

  async setDefault(id: string) {
    await apiClient.patch(`/addresses/${id}/default`);
    await this.syncToStore();
  },
};
