import { Injectable } from '@nestjs/common';
import type {
  BookingSource,
  BookingStatus,
  HotelStatsBreakdown,
  HotelStatsOverview,
  HotelStatsSeries,
  Metric,
  PaymentMethod,
  PaymentStatus,
  RateMetric,
  StatsRangeQuery,
  WalletTxnType,
} from '@stayreco/shared';
import ExcelJS from 'exceljs';
import {
  addDays,
  fromCalendarDate as day,
  todayInVietnam,
  vietnamDateTime,
  vietnamWallClock as vietnamClock,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolvePeriod } from './stats-math';
import { BOOKING_SOURCE, EARNINGS, StatsService } from './stats.service';

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const STATUS: Record<BookingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã huỷ',
  NO_SHOW: 'Không đến',
  EXPIRED: 'Hết hạn giữ phòng',
};
const PAYMENT: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUND_PENDING: 'Chờ duyệt hoàn tiền',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thất bại',
};
const METHOD: Record<PaymentMethod, string> = {
  VNPAY: 'VNPay',
  SEPAY: 'Chuyển khoản (SePay)',
  WALLET: 'Ví StayReco',
  CASH: 'Tiền mặt',
  MIXED: 'Kết hợp',
};
const SOURCE: Record<BookingSource, string> = {
  AI_RECOMMENDATION: 'Gợi ý AI',
  PROMOTION: 'Khuyến mãi',
  DIRECT: 'Trực tiếp',
};
const TXN: Record<WalletTxnType, string> = {
  BOOKING_PAYMENT: 'Khách thanh toán',
  COMMISSION: 'Hoa hồng nền tảng',
  PAYOUT: 'Rút tiền',
  REFUND: 'Hoàn tiền',
  TOPUP: 'Nạp tiền',
  ADJUSTMENT: 'Điều chỉnh',
  SETTLEMENT: 'Chuyển sang khả dụng',
};

const MONEY = '#,##0 "₫"';
const MONEY_2 = '#,##0.00 "₫"';
const INT = '#,##0';
const ONE = '0.0';
const DATE = 'dd/mm/yyyy';
const DATE_TIME = 'dd/mm/yyyy hh:mm';

const viDate = (date: string) => date.split('-').reverse().join('/');

interface BookingRow {
  code: string | null;
  createdAt: Date;
  guestName: string;
  contactPhone: string;
  roomType: string;
  rooms: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number | null;
  status: BookingStatus;
  paymentStatus: PaymentStatus | null;
  method: PaymentMethod | null;
  source: BookingSource;
  total: Prisma.Decimal;
  commission: Prisma.Decimal;
  refunds: Prisma.Decimal;
  net: Prisma.Decimal;
  cancelledAt: Date | null;
}

interface LedgerRow {
  createdAt: Date;
  type: WalletTxnType;
  code: string | null;
  description: string | null;
  amount: Prisma.Decimal;
  balanceAfter: Prisma.Decimal;
}

export interface StatsExport {
  fileName: string;
  content: Buffer;
}

/**
 * The partner dashboard as an Excel workbook (docs/api/partner-dashboard.md §4.8): the figures come from the same
 * services as the screen, computed at the same instant, so the file matches what the owner sees.
 */
@Injectable()
export class StatsExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
  ) {}

  async export(
    hotelId: string,
    query: StatsRangeQuery,
    now = new Date(),
  ): Promise<StatsExport> {
    const period = resolvePeriod(query, todayInVietnam(now));
    const range = { from: period.from, to: period.to };
    const [hotel, overview, series, breakdown, bookings, ledger] =
      await Promise.all([
        this.prisma.hotel.findUniqueOrThrow({
          where: { hotelId },
          select: { name: true },
        }),
        this.stats.overview(hotelId, range, now),
        this.stats.series(hotelId, range, now),
        this.stats.breakdown(hotelId, range, now),
        this.bookings(hotelId, period.from, period.to),
        this.ledger(hotelId, period.from, period.to),
      ]);

    const book = new ExcelJS.Workbook();
    book.creator = 'StayReco';
    book.created = now;
    overviewSheet(book, hotel.name, overview, now);
    seriesSheet(book, series);
    breakdownSheet(book, breakdown);
    bookingsSheet(book, bookings);
    ledgerSheet(book, ledger, overview.cash.netEarnings.value);

    // On Node exceljs already returns a Buffer: no copy then.
    const raw = await book.xlsx.writeBuffer();
    const content = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    return {
      fileName: `StayReco_${slug(hotel.name)}_${period.from}_${period.to}.xlsx`,
      content,
    };
  }

  /** The bookings counted in `bookingsCreated` (§3), with what the hotel wallet recorded for each. */
  private bookings(hotelId: string, from: string, to: string) {
    const start = vietnamDateTime(from, '00:00');
    const end = vietnamDateTime(addDays(to, 1), '00:00');
    // The ledger is read only for the period's bookings, not the hotel's whole history.
    return this.prisma.$queryRaw<BookingRow[]>`
      WITH created AS (
        SELECT b.booking_id
        FROM booking b
        WHERE b.hotel_id = ${hotelId}::uuid
          AND b.status NOT IN ('PENDING', 'EXPIRED')
          AND b.created_at >= ${start} AND b.created_at < ${end}
      ),
      hotel_ledger AS (
        SELECT wt.booking_id,
          -coalesce(sum(wt.amount) FILTER (WHERE wt.type = 'COMMISSION'), 0) AS commission,
          -coalesce(sum(wt.amount) FILTER (WHERE wt.type = 'REFUND'), 0) AS refunds,
          coalesce(sum(wt.amount) FILTER (WHERE ${EARNINGS}), 0) AS net
        FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
        WHERE w.hotel_id = ${hotelId}::uuid AND wt.booking_id IN (SELECT booking_id FROM created)
        GROUP BY wt.booking_id
      )
      SELECT i.invoice_number AS code, b.created_at AS "createdAt", b.guest_name AS "guestName",
        b.contact_phone AS "contactPhone", items.label AS "roomType", items.rooms,
        b.check_in_date::text AS "checkIn", b.check_out_date::text AS "checkOut",
        (b.check_out_date - b.check_in_date) AS nights, b.num_guests AS guests,
        b.status::text AS status, i.payment_status::text AS "paymentStatus", i.payment_method::text AS method,
        ${BOOKING_SOURCE} AS source,
        b.total_amount AS total,
        coalesce(l.commission, 0) AS commission, coalesce(l.refunds, 0) AS refunds, coalesce(l.net, 0) AS net,
        b.cancelled_at AS "cancelledAt"
      FROM created c
      JOIN booking b ON b.booking_id = c.booking_id
      -- "2× Deluxe, 1× Suite" and the rooms over every item.
      JOIN LATERAL (
        SELECT string_agg(bi.num_rooms || '× ' || rt.name, ', ' ORDER BY rt.name) AS label,
          sum(bi.num_rooms)::int AS rooms
        FROM booking_item bi JOIN room_type rt ON rt.room_type_id = bi.room_type_id
        WHERE bi.booking_id = b.booking_id
      ) items ON true
      LEFT JOIN invoice i ON i.booking_id = b.booking_id
      LEFT JOIN hotel_ledger l ON l.booking_id = b.booking_id
      ORDER BY b.created_at, b.booking_id`;
  }

  /** Every movement of the hotel wallet in the period, oldest first. */
  private ledger(hotelId: string, from: string, to: string) {
    const start = vietnamDateTime(from, '00:00');
    const end = vietnamDateTime(addDays(to, 1), '00:00');
    return this.prisma.$queryRaw<LedgerRow[]>`
      SELECT wt.created_at AS "createdAt", wt.type::text AS type, i.invoice_number AS code,
        wt.description, wt.amount, wt.balance_after AS "balanceAfter"
      FROM wallet_transaction wt
      JOIN wallet w ON w.wallet_id = wt.wallet_id
      LEFT JOIN invoice i ON i.booking_id = wt.booking_id
      WHERE w.hotel_id = ${hotelId}::uuid AND wt.created_at >= ${start} AND wt.created_at < ${end}
      ORDER BY wt.created_at, wt.wallet_transaction_id`;
  }
}

/** ASCII file name part: Vietnamese marks dropped, anything else becomes `-`. */
export function slug(name: string) {
  const ascii = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'));
  return (
    ascii
      .replace(/[^A-Za-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'hotel'
  );
}

// ── Sheets ──────────────────────────────────────────────────

interface Column {
  header: string;
  width: number;
  numFmt?: string;
}

/** A table starting at `row`: bold header with a fill, number formats per column. Returns the next free row. */
function table(
  sheet: ExcelJS.Worksheet,
  row: number,
  columns: Column[],
  rows: unknown[][],
) {
  const header = sheet.getRow(row);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8EEF7' },
    };
    cell.border = { bottom: { style: 'thin' } };
    const col = sheet.getColumn(i + 1);
    col.width = Math.max(col.width ?? 0, c.width);
  });
  rows.forEach((values, r) => {
    const line = sheet.getRow(row + 1 + r);
    values.forEach((v, i) => {
      const cell = line.getCell(i + 1);
      cell.value = v as ExcelJS.CellValue;
      if (columns[i].numFmt) cell.numFmt = columns[i].numFmt;
    });
  });
  return row + rows.length + 2;
}

/** A sheet whose only content is one table from row 1, with the header frozen and filters on. */
function listSheet(
  book: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: unknown[][],
) {
  const sheet = book.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  table(sheet, 1, columns, rows);
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  return sheet;
}

function overviewSheet(
  book: ExcelJS.Workbook,
  hotelName: string,
  o: HotelStatsOverview,
  now: Date,
) {
  const sheet = book.addWorksheet('Tổng quan');
  const info: [string, ExcelJS.CellValue, string?][] = [
    ['Khách sạn', hotelName],
    [
      'Kỳ báo cáo',
      `${viDate(o.period.from)} – ${viDate(o.period.to)} (${o.period.days} ngày)`,
    ],
    [
      'Kỳ so sánh',
      `${viDate(o.previous.from)} – ${viDate(o.previous.to)} (${o.previous.days} ngày)`,
    ],
    ['Thời điểm xuất (giờ Việt Nam)', vietnamClock(now), DATE_TIME],
  ];
  sheet.getCell('A1').value = 'Báo cáo kinh doanh StayReco';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  info.forEach(([label, value, fmt], i) => {
    sheet.getCell(3 + i, 1).value = label;
    sheet.getCell(3 + i, 1).font = { bold: true };
    sheet.getCell(3 + i, 2).value = value;
    if (fmt) sheet.getCell(3 + i, 2).numFmt = fmt;
  });

  const m = (label: string, unit: string, x: Metric, fmt: string) => [
    [label, unit, x.value, x.previous, x.deltaPercent, '%'],
    fmt,
  ];
  const r = (label: string, x: RateMetric) => [
    [label, '%', x.value, x.previous, x.deltaPoints, 'điểm %'],
    ONE,
  ];
  const p = o.performance;
  const lines = [
    m('Doanh thu phòng', '₫', p.roomRevenue, MONEY),
    m('Đêm phòng đã bán', 'đêm', p.roomNightsSold, INT),
    m('Đêm phòng có thể bán', 'đêm', p.roomNightsAvailable, INT),
    r('Công suất phòng', p.occupancyRate),
    m('Giá phòng bình quân (ADR)', '₫', p.adr, MONEY_2),
    m('Doanh thu trên mỗi phòng (RevPAR)', '₫', p.revpar, MONEY_2),
    m('Số đơn đặt', 'đơn', p.bookingsCreated, INT),
    m('Số đơn huỷ', 'đơn', p.cancellations, INT),
    r('Tỷ lệ huỷ', p.cancellationRate),
    m('Số đêm lưu trú trung bình', 'đêm', p.avgLengthOfStay, ONE),
    m('Số ngày đặt trước trung bình', 'ngày', p.avgLeadTimeDays, ONE),
    m('Thực nhận', '₫', o.cash.netEarnings, MONEY),
    m('Hoa hồng nền tảng', '₫', o.cash.commission, MONEY),
    m('Hoàn tiền', '₫', o.cash.refunds, MONEY),
    m('Điểm đánh giá trung bình', 'điểm', o.reviews.avgRating, ONE),
    m('Số đánh giá', 'lượt', o.reviews.reviewCount, INT),
  ] as [unknown[], string][];

  const top = 8;
  const next = table(
    sheet,
    top,
    [
      { header: 'Chỉ số', width: 34 },
      // Column B also holds the export time and the pending balance.
      { header: 'Đơn vị', width: 18 },
      { header: 'Kỳ này', width: 18 },
      { header: 'Kỳ trước', width: 18 },
      { header: 'Thay đổi', width: 11, numFmt: ONE },
      { header: 'Thay đổi tính theo', width: 18 },
    ],
    lines.map(([values]) => values),
  );
  lines.forEach(([, fmt], i) => {
    sheet.getCell(top + 1 + i, 3).numFmt = fmt;
    sheet.getCell(top + 1 + i, 4).numFmt = fmt;
  });

  sheet.getCell(next, 1).value = 'Số dư ví lúc xuất';
  sheet.getCell(next, 1).font = { bold: true };
  const wallet = o.wallet ?? { available: 0, pending: 0, reserved: 0 };
  table(
    sheet,
    next + 1,
    [
      { header: 'Khả dụng', width: 34, numFmt: MONEY },
      { header: 'Đang chờ', width: 18, numFmt: MONEY },
      { header: 'Đang giữ', width: 18, numFmt: MONEY },
    ],
    [[wallet.available, wallet.pending, wallet.reserved]],
  );
}

function seriesSheet(book: ExcelJS.Workbook, s: HotelStatsSeries) {
  const unit = { day: 'ngày', week: 'tuần', month: 'tháng' }[s.granularity];
  listSheet(
    book,
    'Theo thời gian',
    [
      { header: `Từ ngày (mỗi dòng 1 ${unit})`, width: 24, numFmt: DATE },
      { header: 'Số ngày', width: 9, numFmt: INT },
      { header: 'Doanh thu phòng', width: 18, numFmt: MONEY },
      { header: 'Đêm đã bán', width: 12, numFmt: INT },
      { header: 'Đêm có thể bán', width: 15, numFmt: INT },
      { header: 'Công suất (%)', width: 13, numFmt: ONE },
      { header: 'ADR', width: 16, numFmt: MONEY_2 },
      { header: 'Số đơn', width: 9, numFmt: INT },
      { header: 'Số đơn huỷ', width: 11, numFmt: INT },
      { header: 'Thực nhận', width: 18, numFmt: MONEY },
    ],
    s.points.map((p) => [
      day(p.periodStart),
      p.days,
      p.roomRevenue,
      p.roomNightsSold,
      p.roomNightsAvailable,
      p.occupancyRate,
      p.adr,
      p.bookingsCreated,
      p.cancellations,
      p.netEarnings,
    ]),
  );
}

function breakdownSheet(book: ExcelJS.Workbook, b: HotelStatsBreakdown) {
  const sheet = book.addWorksheet('Theo loại phòng');
  const t = b.totals;
  let row = table(
    sheet,
    1,
    [
      { header: 'Loại phòng', width: 28 },
      { header: 'Số phòng', width: 10, numFmt: INT },
      { header: 'Đêm đã bán', width: 12, numFmt: INT },
      { header: 'Đêm có thể bán', width: 15, numFmt: INT },
      { header: 'Công suất (%)', width: 13, numFmt: ONE },
      { header: 'Doanh thu phòng', width: 18, numFmt: MONEY },
      { header: 'ADR', width: 16, numFmt: MONEY_2 },
    ],
    [
      ...b.byRoomType.map((r) => [
        r.name,
        r.rooms,
        r.roomNightsSold,
        r.roomNightsAvailable,
        r.occupancyRate,
        r.roomRevenue,
        r.adr,
      ]),
      [
        'Tổng',
        t.rooms,
        t.roomNightsSold,
        t.roomNightsAvailable,
        t.occupancyRate,
        t.roomRevenue,
        t.adr,
      ],
    ],
  );
  sheet.getRow(row - 2).font = { bold: true };

  const share = (title: string, rows: [string, number, number | null][]) => {
    row = table(
      sheet,
      row,
      [
        { header: title, width: 28 },
        { header: 'Số đơn', width: 10, numFmt: INT },
        { header: 'Tỷ lệ (%)', width: 12, numFmt: ONE },
      ],
      rows,
    );
  };
  share(
    'Theo nguồn đặt',
    b.bySource.map((s) => [SOURCE[s.source], s.bookings, s.sharePercent]),
  );
  share(
    'Theo trạng thái hiện tại',
    b.byStatus.map((s) => [STATUS[s.status], s.bookings, s.sharePercent]),
  );
  share(
    'Theo phương thức thanh toán',
    b.byPaymentMethod.map((s) => [
      METHOD[s.method],
      s.bookings,
      s.sharePercent,
    ]),
  );
}

function bookingsSheet(book: ExcelJS.Workbook, rows: BookingRow[]) {
  listSheet(
    book,
    'Danh sách đơn',
    [
      { header: 'Mã đơn', width: 18 },
      { header: 'Ngày đặt', width: 17, numFmt: DATE_TIME },
      { header: 'Tên khách', width: 24 },
      { header: 'SĐT liên hệ', width: 14 },
      { header: 'Loại phòng', width: 20 },
      { header: 'Số phòng', width: 9, numFmt: INT },
      { header: 'Nhận phòng', width: 12, numFmt: DATE },
      { header: 'Trả phòng', width: 12, numFmt: DATE },
      { header: 'Số đêm', width: 8, numFmt: INT },
      { header: 'Số khách', width: 9, numFmt: INT },
      { header: 'Trạng thái đơn', width: 16 },
      { header: 'Trạng thái thanh toán', width: 20 },
      { header: 'Phương thức', width: 20 },
      { header: 'Nguồn', width: 12 },
      { header: 'Tổng tiền', width: 16, numFmt: MONEY },
      { header: 'Hoa hồng', width: 14, numFmt: MONEY },
      { header: 'Hoàn tiền', width: 14, numFmt: MONEY },
      { header: 'Thực nhận của đơn', width: 18, numFmt: MONEY },
      { header: 'Ngày huỷ', width: 17, numFmt: DATE_TIME },
    ],
    rows.map((b) => [
      b.code,
      vietnamClock(b.createdAt),
      b.guestName,
      b.contactPhone,
      b.roomType,
      b.rooms,
      day(b.checkIn),
      day(b.checkOut),
      b.nights,
      b.guests,
      STATUS[b.status],
      b.paymentStatus && PAYMENT[b.paymentStatus],
      b.method && METHOD[b.method],
      SOURCE[b.source],
      toNumber(b.total),
      toNumber(b.commission),
      toNumber(b.refunds),
      toNumber(b.net),
      b.cancelledAt && vietnamClock(b.cancelledAt),
    ]),
  );
}

/** `net`: `overview.cash.netEarnings`, the same rows summed by the dashboard. */
function ledgerSheet(
  book: ExcelJS.Workbook,
  rows: LedgerRow[],
  net: number | null,
) {
  const sheet = listSheet(
    book,
    'Giao dịch ví',
    [
      { header: 'Thời gian', width: 17, numFmt: DATE_TIME },
      { header: 'Loại giao dịch', width: 22 },
      { header: 'Mã đơn', width: 18 },
      { header: 'Mô tả', width: 40 },
      { header: 'Số tiền (±)', width: 16, numFmt: MONEY },
      { header: 'Số dư sau', width: 16, numFmt: MONEY },
    ],
    rows.map((r) => [
      vietnamClock(r.createdAt),
      TXN[r.type],
      r.code,
      r.description,
      toNumber(r.amount),
      toNumber(r.balanceAfter),
    ]),
  );
  const total = sheet.getRow(rows.length + 3);
  total.getCell(4).value =
    'Tổng thực nhận (thanh toán, hoa hồng, hoàn tiền, điều chỉnh)';
  total.getCell(5).value = net ?? 0;
  total.getCell(5).numFmt = MONEY;
  total.font = { bold: true };
}
