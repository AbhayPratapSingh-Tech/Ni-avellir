import type { Product } from '@nidavellir/shared';
import type { AppDispatch } from '../app/store';
import { addItem, updateQuantity } from '../features/cart/cartSlice';
import { appConfig } from '../config/appConfig';
import { cartRepository } from '../services/data/cartRepository';
import { getApiErrorMessage } from '../services/api/apiClient';

type ToastLike = { show: (message: string) => void };

async function syncCartAfterError(productId: string, pincode?: string, dispatch?: AppDispatch) {
  try {
    await cartRepository.refresh(pincode);
  } catch {
    dispatch?.(updateQuantity({ productId, quantity: 0 }));
  }
}

/** Add a product to cart — Redux in mock mode; optimistic Redux + API sync in live mode. */
export async function addProductToCart(options: {
  product: Product;
  quantity?: number;
  dispatch: AppDispatch;
  toast?: ToastLike;
  pincode?: string;
}): Promise<boolean> {
  const { product, quantity = 1, dispatch, toast, pincode } = options;

  if (product.stock <= 0) {
    toast?.show('Out of stock');
    return false;
  }

  if (appConfig.dataSource !== 'api') {
    dispatch(addItem({ product, quantity }));
    return true;
  }

  dispatch(addItem({ product, quantity }));
  try {
    await cartRepository.addItem(product.id, quantity, pincode);
    return true;
  } catch (error) {
    await syncCartAfterError(product.id, pincode, dispatch);
    toast?.show(getApiErrorMessage(error));
    return false;
  }
}

/** Set line quantity — removes the line when quantity is 0. */
export async function setCartLineQuantity(options: {
  product: Product;
  quantity: number;
  dispatch: AppDispatch;
  toast?: ToastLike;
  pincode?: string;
}): Promise<boolean> {
  const { product, quantity, dispatch, toast, pincode } = options;

  if (appConfig.dataSource !== 'api') {
    dispatch(updateQuantity({ productId: product.id, quantity }));
    return true;
  }

  dispatch(updateQuantity({ productId: product.id, quantity }));
  try {
    if (quantity <= 0) {
      await cartRepository.removeItem(product.id, pincode);
    } else {
      await cartRepository.updateItem(product.id, quantity, pincode);
    }
    return true;
  } catch (error) {
    await syncCartAfterError(product.id, pincode, dispatch);
    toast?.show(getApiErrorMessage(error));
    return false;
  }
}
