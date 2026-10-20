import { Injectable } from '@nestjs/common';
import type { Amenity, BedType } from '@stayreco/shared';
import type {
  Amenity as AmenityRow,
  BedType as BedTypeRow,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const toAmenity = (a: AmenityRow): Amenity => ({
  id: a.amenityId,
  name: a.name,
  icon: a.icon,
  category: a.category,
});

export const toBedType = (b: BedTypeRow): BedType => ({
  id: b.bedTypeId,
  name: b.name,
  description: b.description,
  capacity: b.capacity,
});

/** Read-only lists the partner picks from (seeded by `npm run db:seed`). */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async amenities(): Promise<Amenity[]> {
    const rows = await this.prisma.amenity.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toAmenity);
  }

  async bedTypes(): Promise<BedType[]> {
    const rows = await this.prisma.bedType.findMany({
      orderBy: [{ capacity: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toBedType);
  }
}
