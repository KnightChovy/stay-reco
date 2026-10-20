import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { ErrorCode } from '../../common/errors/error-code';

const unavailable = () =>
  new ServiceUnavailableException({
    code: ErrorCode.UPLOAD_UNAVAILABLE,
    message: 'File storage is unavailable',
  });

/** Swap the provider in StorageModule without touching callers. */
export abstract class StorageService {
  /** Public image, served directly from its `url`. `storageKey` is what `deleteImage` needs. */
  abstract uploadImage(
    file: Buffer,
    folder: string,
  ): Promise<{ storageKey: string; url: string }>;

  /** Private file (verification documents): returns a key that only `signedUrl` turns into a link. */
  abstract uploadPrivate(file: Buffer, folder: string): Promise<string>;

  /** Short-lived download link for a private file. */
  abstract signedUrl(storageKey: string, expiresInSeconds: number): string;

  /** Best effort: a file left behind must not fail the request, so failures are only logged. */
  abstract deleteImage(storageKey: string): Promise<void>;
  abstract deletePrivate(storageKey: string): Promise<void>;
}

/** Used when Cloudinary is not configured: uploads answer 503 instead of crashing at startup. */
export class UnconfiguredStorageService extends StorageService {
  uploadImage(): Promise<never> {
    return Promise.reject(unavailable());
  }
  uploadPrivate(): Promise<never> {
    return Promise.reject(unavailable());
  }
  signedUrl(): never {
    throw unavailable();
  }
  deleteImage(): Promise<void> {
    return Promise.resolve();
  }
  deletePrivate(): Promise<void> {
    return Promise.resolve();
  }
}

export interface CloudinaryOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/**
 * Images are public (`type: upload`). Private files use `type: authenticated`, so Cloudinary serves them only
 * through signed, expiring download links. Their key is `<public_id>.<format>` because the link needs both.
 */
export class CloudinaryStorageService extends StorageService {
  private readonly logger = new Logger('Storage');

  constructor({ cloudName, apiKey, apiSecret }: CloudinaryOptions) {
    super();
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(file: Buffer, folder: string) {
    const res = await this.upload(file, { folder });
    return { storageKey: res.public_id, url: res.secure_url };
  }

  async uploadPrivate(file: Buffer, folder: string) {
    const res = await this.upload(file, { folder, type: 'authenticated' });
    return `${res.public_id}.${res.format}`;
  }

  signedUrl(storageKey: string, expiresInSeconds: number) {
    const dot = storageKey.lastIndexOf('.');
    return cloudinary.utils.private_download_url(
      storageKey.slice(0, dot),
      storageKey.slice(dot + 1),
      {
        type: 'authenticated',
        resource_type: 'image',
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      },
    );
  }

  deleteImage(storageKey: string) {
    return this.destroy(storageKey, 'upload');
  }

  deletePrivate(storageKey: string) {
    return this.destroy(
      storageKey.slice(0, storageKey.lastIndexOf('.')),
      'authenticated',
    );
  }

  private upload(
    file: Buffer,
    options: { folder: string; type?: 'authenticated' },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        // PDFs are stored as the image resource type too, so one signed-link format covers every document.
        .upload_stream({ ...options, resource_type: 'image' }, (err, res) => {
          if (res) return resolve(res);
          this.logger.error(`Upload failed: ${err?.message ?? 'no response'}`);
          reject(unavailable());
        })
        .end(file);
    });
  }

  private async destroy(publicId: string, type: 'upload' | 'authenticated') {
    try {
      await cloudinary.uploader.destroy(publicId, {
        type,
        resource_type: 'image',
        invalidate: true,
      });
    } catch (err) {
      this.logger.warn(
        `Could not delete ${publicId}: ${(err as Error).message}`,
      );
    }
  }
}
