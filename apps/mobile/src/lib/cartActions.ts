import {
  productAvailableStock,
  requiresVariantSelection,
  type Product,
} from '@nidavellir/shared';
import type { AppDispatch } from '../app/store';
import { addItem, updateQuantity } from '../features/cart/cartSlice';
import { appConfig } from '../config/appConfig';
import { cartRepository } from '../services/data/cartRepository';
import { getApiErrorMessage } from '../services/api/apiClient';

type ToastLike = { show: (message: string) => void };

async function syncCartAfterError(
  productId: string,
  variantId: string | undefined,
  pincode?: string,
  dispatch?: AppDispatch,
) {
  try {
    await cartRepository.refresh(pincode);
  } catch {
    dispatch?.(updateQuantity({ productId, variantId, quantity: 0 }));
  }
}

/** Add a product to cart — Redux in mock mode; optimistic Redux + API sync in live mode. */
export async function addProductToCart(options: {
  product: Product;
  quantity?: number;
  variantId?: string;
  size?: string;
  color?: string;
  dispatch: AppDispatch;
  toast?: ToastLike;
  pincode?: string;
}): Promise<boolean> {
  const { product, quantity = 1, variantId, size, color, dispatch, toast, pincode } = options;

  if (requiresVariantSelection(product) && !variantId) {
    toast?.show('Select a size');
    return false;
  }

  const available = productAvailableStock(product, variantId);
  if (available <= 0) {
    toast?.show('Out of stock');
    return false;
  }

  if (appConfig.dataSource !== 'api') {
    dispatch(addItem({ product, quantity, variantId, size, color }));
    return true;
  }

  dispatch(addItem({ product, quantity, variantId, size, color }));
  try {
    await cartRepository.addItem(product.id, quantity, pincode, variantId);
    return true;
  } catch (error) {
    await syncCartAfterError(product.id, variantId, pincode, dispatch);
    toast?.show(getApiErrorMessage(error));
    return false;
  }
}

/** Set line quantity — removes the line when quantity is 0. */
export async function setCartLineQuantity(options: {
  product: Product;
  quantity: number;
  variantId?: string;
  dispatch: AppDispatch;
  toast?: ToastLike;
  pincode?: string;
}): Promise<boolean> {
  const { product, quantity, variantId, dispatch, toast, pincode } = options;

  if (appConfig.dataSource !== 'api') {
    dispatch(updateQuantity({ productId: product.id, variantId, quantity }));
    return true;
  }

  dispatch(updateQuantity({ productId: product.id, variantId, quantity }));
  try {
    if (quantity <= 0) {
      await cartRepository.removeItem(product.id, pincode, variantId);
    } else {
      await cartRepository.updateItem(product.id, quantity, pincode, variantId);
    }
    return true;
  } catch (error) {
    await syncCartAfterError(product.id, variantId, pincode, dispatch);
    toast?.show(getApiErrorMessage(error));
    return false;
  }
}
