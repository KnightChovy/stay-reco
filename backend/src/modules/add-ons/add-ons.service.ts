import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AddOnLineInput,
  CreateAddOnInput,
  HotelAddOn,
  UpdateAddOnInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toHotelAddOn } from './add-on.mapper';

export const addOnNotFound = (field?: string) =>
  new NotFoundException({
    code: ErrorCode.ADD_ON_NOT_FOUND,
    message: 'Add-on not found',
    ...(field && { details: [{ field, message: 'not on sale' }] }),
  });

/** One add-on line priced at the catalogue's current price, before it is written to a booking. */
export interface PricedAddOn {
  hotelAddOnId: string;
  name: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  amount: Prisma.Decimal;
}

/**
 * The services a hotel sells on top of the room. The owner keeps the catalogue; a customer books the `prebookable`
 * ones with the stay and pays them in its transfer, staff add any active one during the stay and collect it at the
 * desk. A booking line copies the name and the price, so editing the catalogue never changes what a booking cost.
 */
@Injectable()
export class AddOnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
  ) {}

  /** `hotelId` was checked by `HotelAccessRequired`. Active first, then by name. */
  async list(hotelId: string): Promise<HotelAddOn[]> {
    const rows = await this.prisma.hotelAddOn.findMany({
      where: { hotelId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }, { hotelAddOnId: 'asc' }],
    });
    return rows.map(toHotelAddOn);
  }

  /** What a customer sees on the hotel page. */
  async listActive(hotelId: string): Promise<HotelAddOn[]> {
    const rows = await this.prisma.hotelAddOn.findMany({
      where: { hotelId, isActive: true },
      orderBy: [{ name: 'asc' }, { hotelAddOnId: 'asc' }],
    });
    return rows.map(toHotelAddOn);
  }

  async create(hotelId: string, input: CreateAddOnInput): Promise<HotelAddOn> {
    const row = await this.prisma.hotelAddOn.create({
      data: {
        hotelId,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        timing: input.timing,
        prebookable: input.prebookable,
      },
    });
    return toHotelAddOn(row);
  }

  async update(
    user: AuthUser,
    addOnId: string,
    input: UpdateAddOnInput,
  ): Promise<HotelAddOn> {
    const row = isUuid(addOnId)
      ? await this.prisma.hotelAddOn.findUnique({
          where: { hotelAddOnId: addOnId },
          select: { hotelId: true },
        })
      : null;
    await this.access.assertResource(user, row?.hotelId, 'owner', () =>
      addOnNotFound(),
    );
    const updated = await this.prisma.hotelAddOn.update({
      where: { hotelAddOnId: addOnId },
      data: input,
    });
    return toHotelAddOn(updated);
  }

  /**
   * Prices the lines of a request against the hotel's catalogue. Every add-on must belong to the hotel and be on
   * sale; a customer may only book the prebookable ones. Anything else answers ADD_ON_NOT_FOUND on its line.
   */
  async price(
    hotelId: string,
    lines: AddOnLineInput[] | undefined,
    by: 'customer' | 'staff',
    field = 'addOns',
  ): Promise<{ lines: PricedAddOn[]; total: Prisma.Decimal }> {
    if (!lines?.length) return { lines: [], total: new Prisma.Decimal(0) };
    const rows = await this.prisma.hotelAddOn.findMany({
      where: {
        hotelAddOnId: { in: lines.map((l) => l.addOnId).filter(isUuid) },
        hotelId,
        isActive: true,
        ...(by === 'customer' && { prebookable: true }),
      },
    });
    const byId = new Map(rows.map((r) => [r.hotelAddOnId, r]));
    const priced = lines.map((line, index) => {
      const row = byId.get(line.addOnId);
      if (!row) throw addOnNotFound(`${field}.${index}.addOnId`);
      return {
        hotelAddOnId: row.hotelAddOnId,
        name: row.name,
        unitPrice: row.price,
        quantity: line.quantity,
        amount: row.price.times(line.quantity),
      };
    });
    return {
      lines: priced,
      total: priced.reduce((n, l) => n.plus(l.amount), new Prisma.Decimal(0)),
    };
  }
}
