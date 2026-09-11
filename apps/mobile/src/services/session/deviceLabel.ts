import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@nidavellir/install_device_id';

export type DeviceSessionMeta = {
  /** Stable install id for this app install */
  deviceId: string;
  /** Human label e.g. "samsung SM-G991B" or "iPhone / iPad (iOS 17.0)" */
  deviceLabel: string;
  /** OS string e.g. "Android 34" / "iOS 17.0" */
  os: string;
};

function buildOsLabel(): string {
  if (Platform.OS === 'android') {
    return `Android ${Platform.Version}`;
  }
  if (Platform.OS === 'ios') {
    return `iOS ${String(Platform.Version)}`;
  }
  return Platform.OS;
}

function buildDeviceLabel(): string {
  if (Platform.OS === 'android') {
    const constants = Platform.constants as {
      Brand?: string;
      Manufacturer?: string;
      Model?: string;
    };
    const brand = constants.Brand || constants.Manufacturer || 'Android';
    const model = constants.Model?.trim();
    if (model) return `${brand} ${model}`;
    return `Android ${Platform.Version}`;
  }
  if (Platform.OS === 'ios') {
    // Simulator vs device — Platform.isPad when available
    const isPad = Boolean((Platform as { isPad?: boolean }).isPad);
    return `${isPad ? 'iPad' : 'iPhone'} (iOS ${String(Platform.Version)})`;
  }
  return Platform.OS;
}

/** Label + stable id sent with login/register/OTP so Sessions UI can name devices. */
export async function getDeviceSessionMeta(): Promise<DeviceSessionMeta> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return {
    deviceId,
    deviceLabel: buildDeviceLabel(),
    os: buildOsLabel(),
  };
}
