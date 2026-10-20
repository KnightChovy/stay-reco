import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UPLOAD_RULES,
  type RoomTypeImage,
  type UpdateRoomTypeImageInput,
  type UploadRoomTypeImageInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toRoomTypeImage } from './room.mapper';
import { RoomTypesService, roomTypeNotFound } from './room-types.service';

const imageNotFound = () =>
  new NotFoundException({
    code: ErrorCode.IMAGE_NOT_FOUND,
    message: 'Image not found',
  });

const imageLimitReached = () =>
  new ConflictException({
    code: ErrorCode.IMAGE_LIMIT_REACHED,
    message: `A room type can have at most ${UPLOAD_RULES.maxImages} images`,
  });

/** Room type photos on Cloudinary, shown in `sortOrder` (no cover, unlike hotel images). */
@Injectable()
export class RoomTypeImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly storage: StorageService,
    private readonly roomTypes: RoomTypesService,
  ) {}

  async upload(
    user: AuthUser,
    roomTypeId: string,
    file: Buffer,
    input: UploadRoomTypeImageInput,
  ): Promise<RoomTypeImage> {
    const { hotelId } = await this.roomTypes.findForAccess(
      user,
      roomTypeId,
      'owner',
    );
    // Early check so a full room type does not cost a Cloudinary upload; the binding check is in the transaction.
    if (
      (await this.prisma.roomTypeImage.count({ where: { roomTypeId } })) >=
      UPLOAD_RULES.maxImages
    ) {
      throw imageLimitReached();
    }

    const { storageKey, url } = await this.storage.uploadImage(
      file,
      `stayreco/hotels/${hotelId}/room-types/${roomTypeId}`,
    );
    try {
      const image = await this.prisma.$transaction(async (tx) => {
        // 0 rows locked: the room type was deleted while the file was uploading.
        if (!(await lockRoomType(tx, roomTypeId))) throw roomTypeNotFound();
        const count = await tx.roomTypeImage.count({ where: { roomTypeId } });
        if (count >= UPLOAD_RULES.maxImages) throw imageLimitReached();

        const last = await tx.roomTypeImage.aggregate({
          where: { roomTypeId },
          _max: { sortOrder: true },
        });
        return tx.roomTypeImage.create({
          data: {
            roomTypeId,
            imageUrl: url,
            storageKey,
            caption: input.caption,
            sortOrder: (last._max.sortOrder ?? -1) + 1,
          },
        });
      });
      return toRoomTypeImage(image);
    } catch (err) {
      // Do not leave an orphan file on Cloudinary when the row could not be saved.
      await this.storage.deleteImage(storageKey);
      throw err;
    }
  }

  async update(
    user: AuthUser,
    imageId: string,
    input: UpdateRoomTypeImageInput,
  ): Promise<RoomTypeImage> {
    await this.findForOwner(user, imageId);
    const image = await this.prisma.roomTypeImage.update({
      where: { roomTypeImageId: imageId },
      data: input,
    });
    return toRoomTypeImage(image);
  }

  async remove(user: AuthUser, imageId: string): Promise<void> {
    const image = await this.findForOwner(user, imageId);
    await this.prisma.roomTypeImage.delete({
      where: { roomTypeImageId: imageId },
    });
    await this.storage.deleteImage(image.storageKey);
  }

  private async findForOwner(user: AuthUser, imageId: string) {
    const image = isUuid(imageId)
      ? await this.prisma.roomTypeImage.findUnique({
          where: { roomTypeImageId: imageId },
          include: { roomType: { select: { hotelId: true } } },
        })
      : null;
    await this.access.assertResource(
      user,
      image?.roomType.hotelId,
      'owner',
      imageNotFound,
    );
    return image!;
  }
}
