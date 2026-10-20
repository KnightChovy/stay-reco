import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env';
import {
  CloudinaryStorageService,
  StorageService,
  UnconfiguredStorageService,
} from './storage.service';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      inject: [ConfigService],
      // Cloudinary when configured (env validation guarantees the key and secret); otherwise uploads answer 503.
      useFactory: (config: ConfigService<Env, true>): StorageService => {
        const cloudName = config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
        if (!cloudName) return new UnconfiguredStorageService();

        return new CloudinaryStorageService({
          cloudName,
          apiKey: config.get('CLOUDINARY_API_KEY', { infer: true }),
          apiSecret: config.get('CLOUDINARY_API_SECRET', { infer: true }),
        });
      },
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
