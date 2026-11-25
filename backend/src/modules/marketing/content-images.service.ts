import { Injectable } from '@nestjs/common';
import type { GenerateImageInput, MarketingContent } from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import { AiService } from './ai.service';
import { BrandVoiceService } from './brand-voice.service';
import { ContentService } from './content.service';

/**
 * What the picture model is told every time. A photograph of a real hotel is a claim about it, so the rules are the
 * picture's version of the writer's "never invent a fact": no text to misspell, no logos, nobody's face.
 */
const IMAGE_RULES = `A photograph for a hotel's social media post.
- Photorealistic, natural light, no visible text, letters, logos or watermarks.
- No recognisable faces; people, if any, are seen from behind or far away.
- Show the mood and the setting; do not show a specific price, award or sign.`;

/**
 * The picture that goes out with a post (M18).
 *
 * Staff upload a file rather than paste a URL. The URL was always the thing Meta needs - it fetches the image
 * itself, so a local file is no use to it - but asking a marketing assistant to produce a public URL before they
 * can illustrate a post is asking them to be a sysadmin. The upload path is the same `StorageService` that hotel
 * photos and review photos already use.
 *
 * A picture may be changed exactly as long as the words may, and with the same effect (`ContentService.editable`):
 * changing it on an approved or scheduled piece sends the piece back to `DRAFT` and off the calendar. What the
 * owner approved is what goes out, and that includes which photograph is attached - an image swapped after approval
 * goes back in front of the owner rather than onto the hotel's page.
 */
@Injectable()
export class ContentImagesService {
  constructor(
    private readonly storage: StorageService,
    private readonly content: ContentService,
    private readonly ai: AiService,
    private readonly brandVoice: BrandVoiceService,
  ) {}

  /**
   * The AI draws the picture of a draft (A4) and attaches it, replacing whatever was there.
   *
   * Same window as uploading one, with the same effect on an approved piece, and the same storage, so an approved post goes out with a
   * hosted picture exactly as if staff had uploaded it. The owner sees the picture before approving, which is the
   * human check on what the model drew. Costs one image call against the monthly budget.
   */
  async generate(
    user: AuthUser,
    contentId: string,
    input: GenerateImageInput,
  ): Promise<MarketingContent> {
    const current = await this.content.editable(user, contentId);
    const voice = await this.brandVoice.promptFor(current.hotelId);
    const subject =
      input.prompt ??
      [current.title, current.body].filter(Boolean).join('\n\n');
    const file = await this.ai.image(
      {
        hotelId: current.hotelId,
        hotelStaffId: current.hotelStaffId,
        purpose: 'marketing-image',
      },
      `${IMAGE_RULES}\n\n${voice}\n\nThe post the picture goes with:\n${subject}`,
    );
    const uploaded = await this.storage.uploadImage(file, 'marketing');
    return this.attach(user, current, uploaded);
  }

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
    return this.attach(user, current, uploaded);
  }

  /** Takes the picture off, and deletes the file if we were the ones who put it there. */
  async remove(user: AuthUser, contentId: string): Promise<MarketingContent> {
    const current = await this.content.editable(user, contentId);
    await this.content.saveEdit(user, current, {
      mediaUrl: null,
      mediaStorageKey: null,
    });
    await this.forget(current.mediaStorageKey);
    return this.content.findOne(user, contentId);
  }

  /**
   * Points the piece at a file just uploaded, then deletes the one it replaced. If the save is refused - the piece
   * was submitted, or started going out, while the file uploaded - the new file is deleted instead and the piece
   * keeps its old picture.
   */
  private async attach(
    user: AuthUser,
    current: Awaited<ReturnType<ContentService['editable']>>,
    uploaded: { url: string; storageKey: string },
  ): Promise<MarketingContent> {
    try {
      await this.content.saveEdit(user, current, {
        mediaUrl: uploaded.url,
        mediaStorageKey: uploaded.storageKey,
      });
    } catch (err) {
      await this.forget(uploaded.storageKey);
      throw err;
    }
    await this.forget(current.mediaStorageKey);
    return this.content.findOne(user, current.marketingContentId);
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
