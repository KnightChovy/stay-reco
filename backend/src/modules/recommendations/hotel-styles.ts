import { Injectable } from '@nestjs/common';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { basePriceWhere } from '../rooms/room.mapper';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { hotelStyles } from '../onboarding/onboarding-taste';

/**
 * The travel styles of hotels, for the badges on their cards ("Nghỉ dưỡng & thư giãn", "Gia đình & trẻ nhỏ").
 *
 * Read from the same text the recommender reads (recommender/reco_db.py `load_hotels`: name, city, description, hotel
 * amenities, room types with their description, room amenities) by the same rule (`hotelStyles`), so a badge says
 * exactly what the model ranked the hotel as. A hotel whose text says too little has none.
 */
@Injectable()
export class HotelStyles {
  constructor(private readonly prisma: PrismaService) {}

  async of(hotelIds: string[]): Promise<Map<string, string[]>> {
    if (!hotelIds.length) return new Map();
    const rows = await this.prisma.$queryRaw<
      { hotel_id: string; text: string }[]
    >`
      SELECT h.hotel_id::text AS hotel_id,
             concat_ws(' ', h.name, h.city, h.description,
               (SELECT string_agg(a.name, ', ') FROM hotel_amenity ha JOIN amenity a ON a.amenity_id = ha.amenity_id
                 WHERE ha.hotel_id = h.hotel_id),
               (SELECT string_agg(rt.name || ' ' || coalesce(rt.description, ''), '. ') FROM room_type rt
                 WHERE rt.hotel_id = h.hotel_id),
               (SELECT string_agg(DISTINCT a.name, ', ') FROM room_type rt
                 JOIN room_type_amenity rta ON rta.room_type_id = rt.room_type_id
                 JOIN amenity a ON a.amenity_id = rta.amenity_id
                 WHERE rt.hotel_id = h.hotel_id)) AS text
      FROM hotel h WHERE h.hotel_id = ANY(${hotelIds}::uuid[])`;
    return new Map(rows.map((r) => [r.hotel_id, hotelStyles(r.text ?? '')]));
  }

  /** Every bookable hotel with its city, styles and cheapest base price per night (null when none is set). */
  async catalogue(): Promise<
    { hotelId: string; city: string; styles: string[]; from: number | null }[]
  > {
    const hotels = await this.prisma.hotel.findMany({
      where: bookableHotel,
      select: {
        hotelId: true,
        city: true,
        roomTypes: {
          where: sellableRoomType,
          select: {
            prices: { where: basePriceWhere, select: { pricePerNight: true } },
          },
        },
      },
    });
    const styles = await this.of(hotels.map((h) => h.hotelId));
    return hotels.map((h) => {
      const prices = h.roomTypes
        .flatMap((rt) => rt.prices.map((p) => toNumber(p.pricePerNight)))
        .filter((p): p is number => p !== null);
      return {
        hotelId: h.hotelId,
        city: h.city,
        styles: styles.get(h.hotelId) ?? [],
        from: prices.length ? Math.min(...prices) : null,
      };
    });
  }
}
