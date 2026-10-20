import {
  createRoomSchema,
  createRoomTypeSchema,
  lockRoomSchema,
  roomListQuerySchema,
  updateRoomSchema,
  updateRoomTypeImageSchema,
  updateRoomTypeSchema,
  uploadRoomTypeImageSchema,
} from '@stayreco/shared';
import { zodDto } from '../../../common/pipes/validation';

export class CreateRoomTypeDto extends zodDto(createRoomTypeSchema) {}
export class UpdateRoomTypeDto extends zodDto(updateRoomTypeSchema) {}
export class UploadRoomTypeImageDto extends zodDto(uploadRoomTypeImageSchema) {}
export class UpdateRoomTypeImageDto extends zodDto(updateRoomTypeImageSchema) {}
export class CreateRoomDto extends zodDto(createRoomSchema) {}
export class UpdateRoomDto extends zodDto(updateRoomSchema) {}
export class LockRoomDto extends zodDto(lockRoomSchema) {}
export class RoomListQueryDto extends zodDto(roomListQuerySchema) {}
