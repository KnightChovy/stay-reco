import { Injectable } from '@nestjs/common';
import type { Metric, PlatformExportQuery, Region } from '@stayreco/shared';
import ExcelJS from 'exceljs';
import { todayInVietnam } from '../../common/http/calendar-date';
import {
  DATE,
  DATE_TIME,
  INT,
  listSheet,
  MONEY,
  ONE,
} from '../stats/stats-export.service';
import { PlatformStatsService, platformPeriod } from './platform-stats.service';

const REGION_NAME: Record<Region, string> = {
  NORTH: 'Miền Bắc',
  CENTRAL: 'Miền Trung',
  SOUTH: 'Miền Nam',
  OTHER: 'Khác',
};

const viDate = (date: string) => date.split('-').reverse().join('/');
/** Excel shows a `Date` as the wall clock it holds: shift UTC instants to Vietnam time. */
const vietnamClock = (iso: string) =>
  new Date(new Date(iso).getTime() + 7 * 3_600_000);
const metricRow = (label: string, m: Metric) => [
  label,
  m.value,
  m.previous,
  m.deltaPercent,
];

export interface PlatformExport {
  fileName: string;
  content: Buffer;
}

/**
 * The platform figures as an Excel workbook (UC76): one report per file, with the figures of the matching endpoint for
 * the same period and the rows behind them. Headers in Vietnamese, money as `#,##0 ₫`.
 */
@Injectable()
export class PlatformExportService {
  constructor(private readonly stats: PlatformStatsService) {}

  async export(
    query: PlatformExportQuery,
    now = new Date(),
  ): Promise<PlatformExport> {
    const period = platformPeriod(query, todayInVietnam(now));
    const range = { from: period.from, to: period.to };
    const book = new ExcelJS.Workbook();
    book.creator = 'StayReco';
    book.created = now;

    if (query.report === 'revenue') {
      const [r, hotels] = await Promise.all([
        this.stats.revenue(range, now),
        this.stats.hotels(
          {
            ...range,
            page: 1,
            pageSize: Number.MAX_SAFE_INTEGER,
            sort: 'gmv-desc',
          },
          now,
        ),
      ]);
      const pct = { header: 'Thay đổi (%)', width: 14, numFmt: ONE };
      listSheet(
        book,
        'Tổng quan',
        [
          { header: 'Chỉ số', width: 28 },
          {
            header: `Kỳ này (${viDate(r.period.from)}–${viDate(r.period.to)})`,
            width: 26,
            numFmt: MONEY,
          },
          {
            header: `Kỳ trước (${viDate(r.previous.from)}–${viDate(r.previous.to)})`,
            width: 26,
            numFmt: MONEY,
          },
          pct,
        ],
        [
          metricRow('GMV (khách đã trả)', r.totals.gmv),
          metricRow('Giảm giá (khuyến mãi, voucher)', r.totals.discounts),
          metricRow('Điểm thưởng đã dùng', r.totals.pointsUsed),
          metricRow('Hoàn tiền', r.totals.refunds),
          metricRow('Hoa hồng', r.totals.commission),
          metricRow('Chi phí nền tảng', r.totals.platformDebits),
          metricRow('Doanh thu nền tảng', r.totals.platformRevenue),
          metricRow('Số đơn đã thanh toán', r.totals.bookings),
        ],
      );
      listSheet(
        book,
        'Theo thời gian',
        [
          { header: 'Từ ngày', width: 12, numFmt: DATE },
          { header: 'Số ngày', width: 9, numFmt: INT },
          { header: 'GMV', width: 18, numFmt: MONEY },
          { header: 'Hoa hồng', width: 16, numFmt: MONEY },
          { header: 'Số đơn', width: 10, numFmt: INT },
        ],
        r.series.map((p) => [
          new Date(`${p.periodStart}T00:00:00Z`),
          p.days,
          p.gmv,
          p.commission,
          p.bookings,
        ]),
      );
      listSheet(
        book,
        'Theo vùng',
        [
          { header: 'Vùng', width: 14 },
          { header: 'Khách sạn đang hoạt động', width: 14, numFmt: INT },
          { header: 'GMV', width: 18, numFmt: MONEY },
          { header: 'GMV kỳ trước', width: 18, numFmt: MONEY },
          { header: 'Hoa hồng', width: 16, numFmt: MONEY },
          { header: 'Số đơn', width: 10, numFmt: INT },
        ],
        r.byRegion.map((x) => [
          REGION_NAME[x.region],
          x.hotels,
          x.gmv.value,
          x.gmv.previous,
          x.commission.value,
          x.bookings.value,
        ]),
      );
      listSheet(
        book,
        'Theo khách sạn',
        [
          { header: 'Khách sạn', width: 30 },
          { header: 'Thành phố', width: 16 },
          { header: 'Vùng', width: 12 },
          { header: 'Đối tác', width: 26 },
          { header: 'Số đơn', width: 10, numFmt: INT },
          { header: 'GMV', width: 18, numFmt: MONEY },
          { header: 'Hoa hồng', width: 16, numFmt: MONEY },
          { header: 'Hoàn tiền', width: 16, numFmt: MONEY },
          { header: 'Tỷ lệ huỷ (%)', width: 12, numFmt: ONE },
        ],
        hotels.items.map((h) => [
          h.hotel.name,
          h.hotel.city,
          REGION_NAME[h.hotel.region],
          h.partner.name,
          h.bookings,
          h.gmv,
          h.commission,
          h.refunds,
          h.cancellationRate,
        ]),
      );
    } else if (query.report === 'commissions') {
      const rows = await this.stats.allCommissions(range, now);
      const sheet = listSheet(
        book,
        'Hoa hồng',
        [
          { header: 'Mã đơn', width: 18 },
          { header: 'Khách sạn', width: 30 },
          { header: 'Trả phòng', width: 12, numFmt: DATE },
          { header: 'Tổng tiền', width: 16, numFmt: MONEY },
          { header: 'Tỷ lệ (%)', width: 10, numFmt: '0.00' },
          { header: 'Hoa hồng', width: 16, numFmt: MONEY },
          { header: 'Trạng thái', width: 14 },
          { header: 'Thời điểm thu', width: 17, numFmt: DATE_TIME },
        ],
        rows.map((c) => [
          c.booking.code,
          c.hotel.name,
          new Date(`${c.checkOutDate}T00:00:00Z`),
          c.total,
          c.rate,
          c.amount,
          c.status === 'CHARGED' ? 'Đã thu' : 'Dự kiến',
          c.chargedAt && vietnamClock(c.chargedAt),
        ]),
      );
      const total = sheet.getRow(rows.length + 3);
      total.getCell(5).value = 'Đã thu';
      total.getCell(6).value = rows
        .filter((c) => c.status === 'CHARGED')
        .reduce((s, c) => s + c.amount, 0);
      total.getCell(6).numFmt = MONEY;
      total.font = { bold: true };
    } else {
      const [c, unmatched] = await Promise.all([
        this.stats.cashflow(range, now),
        this.stats.unmatchedTransfers(period),
      ]);
      listSheet(
        book,
        'Dòng tiền',
        [
          { header: 'Khoản', width: 48 },
          { header: 'Số tiền', width: 20, numFmt: MONEY },
        ],
        [
          ['Nhận qua SePay trong kỳ', c.received.sepay],
          ['Số giao dịch SePay', c.received.transfers],
          [
            'Thanh toán bằng ví khách hàng (không phải tiền mới)',
            c.received.wallet,
          ],
          ['— đã hoàn vào ví khách hàng', c.split.refunded],
          ['— hoa hồng đã thu', c.split.commission],
          ['— đã quyết toán cho khách sạn', c.split.hotelSettled],
          ['— đang giữ cho khách sạn', c.split.hotelPending],
          ['Chênh lệch (phải bằng 0)', c.split.difference],
          ['Chuyển khoản không khớp hoặc đến trễ', c.unmatched.amount],
          ['Tiền rút đã chi cho đối tác trong kỳ', c.payoutsPaid.amount],
          [
            'Đối soát: tiền ngân hàng dự kiến (từ trước đến nay)',
            c.reconciliation.bankExpected,
          ],
          ['Đối soát: tổng số dư mọi ví', c.reconciliation.walletTotal],
          ['Đối soát: chênh lệch (phải bằng 0)', c.reconciliation.difference],
        ],
      );
      listSheet(
        book,
        'Chuyển khoản lệch',
        [
          { header: 'Thời gian', width: 17, numFmt: DATE_TIME },
          { header: 'Loại', width: 14 },
          { header: 'Lý do', width: 22 },
          { header: 'Mã đơn', width: 18 },
          { header: 'Số tiền', width: 16, numFmt: MONEY },
          { header: 'Nội dung chuyển khoản', width: 40 },
          { header: 'Mã SePay', width: 14 },
        ],
        unmatched.map((u) => {
          const v = JSON.parse(u.newValue ?? '{}') as Record<string, unknown>;
          return [
            vietnamClock(u.createdAt.toISOString()),
            u.action === 'SEPAY_TRANSFER_LATE' ? 'Đến trễ' : 'Không khớp',
            v.reason ?? null,
            v.code ?? null,
            typeof v.amount === 'number' ? v.amount : null,
            v.content ?? null,
            v.sepayId ?? null,
          ];
        }),
      );
    }

    const raw = await book.xlsx.writeBuffer();
    const content = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    return {
      fileName: `StayReco_${query.report}_${period.from}_${period.to}.xlsx`,
      content,
    };
  }
}
