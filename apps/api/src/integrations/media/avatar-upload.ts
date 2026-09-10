import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../common/errors/app-error.js';

function cloudinaryReady() {
  return Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        !String(process.env.CLOUDINARY_API_KEY).startsWith('replace-with')),
  );
}

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/** Persist a profile photo for cross-device sync (HTTPS Cloudinary URL or data URI). */
export async function persistAvatarImage(buffer: Buffer, mimeType: string): Promise<string> {
  const mime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  if (buffer.length > 1_200_000) {
    throw new AppError('Profile photo is too large (max ~1MB)', 413);
  }

  if (cloudinaryReady()) {
    configureCloudinary();
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'nidavellir/avatars',
          resource_type: 'image',
          overwrite: true,
          transformation: [{ width: 512, height: 512, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({ secure_url: result.secure_url });
        },
      );
      stream.end(buffer);
    });
    return uploaded.secure_url;
  }

  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
  if (dataUri.length > 1_400_000) {
    throw new AppError('Profile photo is too large after encoding', 413);
  }
  return dataUri;
}

export function isPersistedAvatarUrl(value?: string | null): boolean {
  if (!value) return false;
  return (
    value.startsWith('https://') ||
    value.startsWith('http://') ||
    value.startsWith('data:image/')
  );
}
