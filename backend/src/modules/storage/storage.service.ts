import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { ErrorCode } from '../../common/errors/error-code';

const unavailable = () =>
  new ServiceUnavailableException({
    code: ErrorCode.UPLOAD_UNAVAILABLE,
    message: 'File storage is unavailable',
  });

const rejectedFile = (reason: string) =>
  new BadRequestException({
    code: ErrorCode.UPLOAD_INVALID_FILE,
    message: `The file was rejected: ${reason}`,
  });

/** What an upload gives back; the dimensions let a caller check the shape of what was stored. */
export interface UploadedImage {
  storageKey: string;
  url: string;
  width: number;
  height: number;
}

/** Swap the provider in StorageModule without touching callers. */
export abstract class StorageService {
  /** Public image, served directly from its `url`. `storageKey` is what `deleteImage` needs. */
  abstract uploadImage(file: Buffer, folder: string): Promise<UploadedImage>;

  /** Private file (verification documents): returns a key that only `signedUrl` turns into a link. */
  abstract uploadPrivate(file: Buffer, folder: string): Promise<string>;

  /** Short-lived download link for a private file. */
  abstract signedUrl(storageKey: string, expiresInSeconds: number): string;

  /** The `storageKey` of an image from its `url`, for rows that keep only the URL; null for a URL issued elsewhere. */
  abstract imageKeyFromUrl(url: string): string | null;

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
  imageKeyFromUrl(): null {
    return null;
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
  private readonly imageUrlPrefix: string;

  constructor({ cloudName, apiKey, apiSecret }: CloudinaryOptions) {
    super();
    this.imageUrlPrefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(file: Buffer, folder: string) {
    const res = await this.upload(file, { folder });
    return {
      storageKey: res.public_id,
      url: res.secure_url,
      width: res.width,
      height: res.height,
    };
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

  /** `secure_url` is `<prefix>v<version>/<public_id>.<format>`. */
  imageKeyFromUrl(url: string) {
    if (!url.startsWith(this.imageUrlPrefix)) return null;
    const path = url.slice(this.imageUrlPrefix.length).replace(/^v\d+\//, '');
    const dot = path.lastIndexOf('.');
    return dot > 0 ? path.slice(0, dot) : null;
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
          // 4xx: Cloudinary refused the file itself (e.g. "Invalid image file" for a broken body behind a valid
          // signature), so it is the client's file, not an outage.
          if (err?.http_code && err.http_code < 500) {
            return reject(rejectedFile(err.message));
          }
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
