import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorageService } from './storage.service';

type UploadCallback = (err?: unknown, res?: unknown) => void;

/** Makes the next `upload_stream` call answer with `err` / `res`, as Cloudinary's SDK does. */
function cloudinaryAnswers(err?: unknown, res?: unknown) {
  jest.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
    _options: unknown,
    callback: UploadCallback,
  ) => ({
    end: () => callback(err, res),
  })) as unknown as typeof cloudinary.uploader.upload_stream);
}

describe('CloudinaryStorageService', () => {
  const storage = new CloudinaryStorageService({
    cloudName: 'test',
    apiKey: 'key',
    apiSecret: 'secret',
  });
  const file = Buffer.from('89504e470d0a1a0a', 'hex');

  afterEach(() => jest.restoreAllMocks());

  it('returns the key and url of an uploaded image', async () => {
    cloudinaryAnswers(undefined, {
      public_id: 'stayreco/hotels/h1/abc',
      secure_url: 'https://res.cloudinary.com/test/abc.png',
    });
    await expect(
      storage.uploadImage(file, 'stayreco/hotels/h1'),
    ).resolves.toEqual({
      storageKey: 'stayreco/hotels/h1/abc',
      url: 'https://res.cloudinary.com/test/abc.png',
    });
  });

  it('reports a file Cloudinary refuses (4xx) as UPLOAD_INVALID_FILE', async () => {
    cloudinaryAnswers({ http_code: 400, message: 'Invalid image file' });
    const upload = storage.uploadImage(file, 'stayreco/hotels/h1');
    await expect(upload).rejects.toBeInstanceOf(BadRequestException);
    await expect(upload).rejects.toMatchObject({
      response: { code: 'UPLOAD_INVALID_FILE' },
    });
  });

  it('reports outages and 5xx as UPLOAD_UNAVAILABLE', async () => {
    for (const err of [
      { message: 'getaddrinfo ENOTFOUND' },
      { http_code: 500, message: 'Server error' },
    ]) {
      cloudinaryAnswers(err);
      const upload = storage.uploadPrivate(file, 'stayreco/verification/p1');
      await expect(upload).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(upload).rejects.toMatchObject({
        response: { code: 'UPLOAD_UNAVAILABLE' },
      });
    }
  });
});
