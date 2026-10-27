import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const PICK_OPTIONS = {
  mediaType: 'photo' as const,
  quality: 0.7 as const,
  maxWidth: 1024,
  maxHeight: 1024,
  selectionLimit: 1,
  saveToPhotos: false,
};

export type VisualSearchPickResult = {
  uri?: string;
  /** User-facing message when camera/library fails (not cancel). */
  error?: string;
};

async function ensureAndroidCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
  if (already) {
    return true;
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
    title: 'Camera permission',
    message: 'Niðavellir needs the camera for visual product search.',
    buttonNeutral: 'Ask me later',
    buttonNegative: 'Cancel',
    buttonPositive: 'OK',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function openCamera(): Promise<VisualSearchPickResult> {
  try {
    const allowed = await ensureAndroidCameraPermission();
    if (!allowed) {
      return { error: 'Camera permission is required' };
    }
    const result = await launchCamera(PICK_OPTIONS);
    if (result.didCancel) {
      return {};
    }
    if (result.errorCode) {
      return {
        error:
          result.errorMessage ||
          (result.errorCode === 'camera_unavailable'
            ? 'Camera is unavailable on this device'
            : 'Could not open camera'),
      };
    }
    const uri = result.assets?.[0]?.uri;
    return uri ? { uri } : { error: 'No photo captured' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open camera';
    // Emulators / missing ImagePicker camera bridge often throw NativeEventEmitter noise.
    if (/NativeEventEmitter|addListener|camera/i.test(message)) {
      return {
        error: 'Camera is unavailable here — try Library, or a physical device',
      };
    }
    return { error: message };
  }
}

async function openLibrary(): Promise<VisualSearchPickResult> {
  try {
    const result = await launchImageLibrary(PICK_OPTIONS);
    if (result.didCancel) {
      return {};
    }
    if (result.errorCode) {
      return { error: result.errorMessage || 'Could not open gallery' };
    }
    const uri = result.assets?.[0]?.uri;
    return uri ? { uri } : { error: 'No photo selected' };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Could not open gallery',
    };
  }
}

/** Camera or library → local image URI for visual search upload. */
export function pickVisualSearchImage(): Promise<VisualSearchPickResult> {
  return new Promise((resolve) => {
    Alert.alert('Search by photo', 'Find merch that looks like this.', [
      {
        text: 'Camera',
        onPress: () => {
          void openCamera().then(resolve);
        },
      },
      {
        text: 'Library',
        onPress: () => {
          void openLibrary().then(resolve);
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve({}) },
    ]);
  });
}
