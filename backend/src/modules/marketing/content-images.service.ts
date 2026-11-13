import { Injectable } from '@nestjs/common';
import type { MarketingContent } from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ContentService } from './content.service';

/**
 * The picture that goes out with a post (M18).
 *
 * Staff upload a file rather than paste a URL. The URL was always the thing Meta needs - it fetches the image
 * itself, so a local file is no use to it - but asking a marketing assistant to produce a public URL before they
 * can illustrate a post is asking them to be a sysadmin. The upload path is the same `StorageService` that hotel
 * photos and review photos already use.
 *
 * A picture may be changed exactly as long as the words may: while the piece is a draft or has been rejected.
 * What the owner approved is what goes out, and that includes which photograph is attached - an image swapped
 * after approval would put something on the hotel's page that nobody agreed to.
 */
@Injectable()
export class ContentImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly content: ContentService,
  ) {}

  /**
   * Attaches a picture, replacing whatever was there.
   *
   * The new file is uploaded before the old one is deleted: if the upload fails the piece keeps the picture it
   * had, rather than losing it to a failure that had nothing to do with it.
   */
  async set(
    user: AuthUser,
    contentId: string,
    file: Buffer,
  ): Promise<MarketingContent> {
    const current = await this.content.editable(user, contentId);
    const uploaded = await this.storage.uploadImage(file, 'marketing');
    await this.prisma.marketingContent.update({
      where: { marketingContentId: contentId },
      data: { mediaUrl: uploaded.url, mediaStorageKey: uploaded.storageKey },
    });
    await this.forget(current.mediaStorageKey);
    return this.content.findOne(user, contentId);
  }

  /** Takes the picture off, and deletes the file if we were the ones who put it there. */
  async remove(user: AuthUser, contentId: string): Promise<MarketingContent> {
    const current = await this.content.editable(user, contentId);
    await this.prisma.marketingContent.update({
      where: { marketingContentId: contentId },
      data: { mediaUrl: null, mediaStorageKey: null },
    });
    await this.forget(current.mediaStorageKey);
    return this.content.findOne(user, contentId);
  }

  /**
   * Deletes a file we uploaded, and shrugs if the storage refuses.
   *
   * A file left behind in Cloudinary costs a fraction of a cent and nothing else; a request that fails after the
   * database already points elsewhere costs the staff member their work. A null key means the URL was typed in by
   * hand and the file is not ours to delete.
   */
  private async forget(storageKey: string | null): Promise<void> {
    if (!storageKey) return;
    try {
      await this.storage.deleteImage(storageKey);
    } catch {
      // Nothing the caller can do about it, and nothing they need to know.
    }
  }
}
