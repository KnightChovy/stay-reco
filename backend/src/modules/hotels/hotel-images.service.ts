import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UPLOAD_RULES,
  type HotelImage,
  type UpdateHotelImageInput,
  type UploadHotelImageInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockHotel } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toHotelImage } from './hotel.mapper';

const imageNotFound = () =>
  new NotFoundException({
    code: ErrorCode.IMAGE_NOT_FOUND,
    message: 'Image not found',
  });

const imageLimitReached = () =>
  new ConflictException({
    code: ErrorCode.IMAGE_LIMIT_REACHED,
    message: `A hotel can have at most ${UPLOAD_RULES.maxImages} images`,
  });

/** Hotel photos on Cloudinary. A hotel with images always has exactly one cover. */
@Injectable()
export class HotelImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly storage: StorageService,
  ) {}

  /** `hotelId` was checked by `HotelAccessRequired`. The first image becomes the cover. */
  async upload(
    hotelId: string,
    file: Buffer,
    input: UploadHotelImageInput,
  ): Promise<HotelImage> {
    // Early check so a full hotel does not cost a Cloudinary upload; the binding check is inside the transaction.
    if (
      (await this.prisma.hotelImage.count({ where: { hotelId } })) >=
      UPLOAD_RULES.maxImages
    ) {
      throw imageLimitReached();
    }

    const { storageKey, url } = await this.storage.uploadImage(
      file,
      `stayreco/hotels/${hotelId}`,
    );
    try {
      const image = await this.prisma.$transaction(async (tx) => {
        // Lock the hotel row so concurrent uploads to the same hotel count and pick the cover one after another.
        await lockHotel(tx, hotelId);
        const count = await tx.hotelImage.count({ where: { hotelId } });
        if (count >= UPLOAD_RULES.maxImages) throw imageLimitReached();

        const isCover = count === 0 || input.isCover === true;
        if (isCover) {
          await tx.hotelImage.updateMany({
            where: { hotelId },
            data: { isCover: false },
          });
        }
        const last = await tx.hotelImage.aggregate({
          where: { hotelId },
          _max: { sortOrder: true },
        });
        return tx.hotelImage.create({
          data: {
            hotelId,
            imageUrl: url,
            storageKey,
            caption: input.caption,
            isCover,
            sortOrder: (last._max.sortOrder ?? -1) + 1,
          },
        });
      });
      return toHotelImage(image);
    } catch (err) {
      // Do not leave an orphan file on Cloudinary when the row could not be saved.
      await this.storage.deleteImage(storageKey);
      throw err;
    }
  }

  async update(
    user: AuthUser,
    imageId: string,
    input: UpdateHotelImageInput,
  ): Promise<HotelImage> {
    const { hotelId } = await this.findForOwner(user, imageId);
    const image = await this.prisma.$transaction(async (tx) => {
      if (input.isCover) {
        await tx.hotelImage.updateMany({
          where: { hotelId },
          data: { isCover: false },
        });
      }
      return tx.hotelImage.update({
        where: { hotelImageId: imageId },
        data: input,
      });
    });
    return toHotelImage(image);
  }

  /** Deleting the cover moves it to the next image in display order. */
  async remove(user: AuthUser, imageId: string): Promise<void> {
    const image = await this.findForOwner(user, imageId);
    await this.prisma.$transaction(async (tx) => {
      await tx.hotelImage.delete({ where: { hotelImageId: imageId } });
      if (!image.isCover) return;

      const next = await tx.hotelImage.findFirst({
        where: { hotelId: image.hotelId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { hotelImageId: true },
      });
      if (next) {
        await tx.hotelImage.update({
          where: { hotelImageId: next.hotelImageId },
          data: { isCover: true },
        });
      }
    });
    await this.storage.deleteImage(image.storageKey);
  }

  private async findForOwner(user: AuthUser, imageId: string) {
    const image = isUuid(imageId)
      ? await this.prisma.hotelImage.findUnique({
          where: { hotelImageId: imageId },
        })
      : null;
    await this.access.assertResource(
      user,
      image?.hotelId,
      'owner',
      imageNotFound,
    );
    return image!;
  }
}
