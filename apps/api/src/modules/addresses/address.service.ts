import { AppError } from '../../common/errors/app-error.js';
import { Address } from './address.model.js';

export class AddressService {
  async list(userId: string) {
    return Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 }).lean();
  }

  async create(
    userId: string,
    input: {
      label?: string;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      isDefault?: boolean;
    },
  ) {
    if (input.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }
    const count = await Address.countDocuments({ userId });
    return Address.create({
      userId,
      ...input,
      isDefault: input.isDefault ?? count === 0,
    });
  }

  async update(userId: string, id: string, input: Partial<Parameters<AddressService['create']>[1]>) {
    const address = await Address.findOne({ _id: id, userId });
    if (!address) throw new AppError('Address not found', 404);
    if (input.isDefault) await Address.updateMany({ userId }, { isDefault: false });
    Object.assign(address, input);
    await address.save();
    return address;
  }

  async remove(userId: string, id: string) {
    const address = await Address.findOneAndDelete({ _id: id, userId });
    if (!address) throw new AppError('Address not found', 404);
    if (address.isDefault) {
      const next = await Address.findOne({ userId }).sort({ updatedAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    return { ok: true };
  }

  async setDefault(userId: string, id: string) {
    const address = await Address.findOne({ _id: id, userId });
    if (!address) throw new AppError('Address not found', 404);
    await Address.updateMany({ userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();
    return address;
  }
}
