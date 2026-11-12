import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminTransactionDetailResponseSchema,
  adminTransactionListQuerySchema,
  adminTransactionResponseSchema,
  paymentSettingsCheckResponseSchema,
  paymentSettingsResponseSchema,
  unmatchedTransferListQuerySchema,
  unmatchedTransferResponseSchema,
} from '@stayreco/shared';
import type { Request } from 'express';
import ExcelJS from 'exceljs';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { todayInVietnam } from '../../common/http/calendar-date';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiData,
  ApiErrors,
  ApiFile,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { platformPeriod } from '../platform/platform-stats.service';
import {
  DATE_TIME,
  listSheet,
  MONEY,
  XLSX_MIME,
} from '../stats/stats-export.service';
import { AdminPaymentsService } from './admin-payments.service';

class TransactionListQueryDto extends zodDto(adminTransactionListQuerySchema) {}
class UnmatchedListQueryDto extends zodDto(unmatchedTransferListQuerySchema) {}

const PERIOD =
  '`from` and `to` together (at most 366 days), or neither for the last 30 days.';

/** Excel shows a `Date` as the wall clock it holds: shift UTC instants to Vietnam time. */
const vietnamClock = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 7 * 3_600_000) : null;

/** Payments and refunds, and the payment gateway settings (UC78, UC79; docs/api/admin.md). `ADMIN` only. */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminPaymentsController {
  constructor(private readonly payments: AdminPaymentsService) {}

  @ApiOperation({
    summary: 'Payments and refunds, one row per booking invoice',
    description: `Period on the invoice's creation. \`status\` (payment status) and \`method\` may be repeated; \`search\` matches the booking code or the SePay transaction id; \`mismatch=true\` keeps the invoices whose confirmed amount differs from the expected one. ${PERIOD}`,
  })
  @ApiPage(adminTransactionResponseSchema)
  @Get('transactions')
  transactions(@Query() query: TransactionListQueryDto) {
    return this.payments.transactions(query);
  }

  @ApiOperation({
    summary: 'SePay transfers that confirmed nothing or came late',
    description: `Newest first, with the amount, transfer content and SePay id, to be refunded by hand. ${PERIOD}`,
  })
  @ApiPage(unmatchedTransferResponseSchema)
  @Get('transactions/unmatched')
  unmatched(@Query() query: UnmatchedListQueryDto) {
    return this.payments.unmatched(query);
  }

  @ApiOperation({
    summary: 'The transactions of the query as an Excel file',
    description: `Same filters as the list, every row (at most 10,000). ${PERIOD}`,
  })
  @ApiFile(
    XLSX_MIME,
    'The workbook, named `StayReco_giao-dich_<from>_<to>.xlsx`.',
  )
  @Get('transactions/export')
  async export(@Query() query: TransactionListQueryDto) {
    const now = new Date();
    const period = platformPeriod(query, todayInVietnam(now));
    const rows = await this.payments.allTransactions(query, now);
    const book = new ExcelJS.Workbook();
    book.creator = 'StayReco';
    book.created = now;
    listSheet(
      book,
      'Giao dịch',
      [
        { header: 'Mã đơn', width: 18 },
        { header: 'Khách sạn', width: 28 },
        { header: 'Phương thức', width: 12 },
        { header: 'Trạng thái thanh toán', width: 20 },
        { header: 'Số tiền phải trả', width: 16, numFmt: MONEY },
        { header: 'Số tiền xác nhận', width: 16, numFmt: MONEY },
        { header: 'Đã hoàn', width: 14, numFmt: MONEY },
        { header: 'Lệch', width: 8 },
        { header: 'Mã giao dịch SePay', width: 20 },
        { header: 'Thanh toán lúc', width: 17, numFmt: DATE_TIME },
        { header: 'Tạo lúc', width: 17, numFmt: DATE_TIME },
      ],
      rows.map((r) => [
        r.booking.code,
        r.hotel.name,
        r.method,
        r.status,
        r.expectedAmount,
        r.confirmedAmount,
        r.refunded,
        r.mismatch ? 'Có' : '',
        r.gatewayTransactionId,
        vietnamClock(r.paidAt),
        vietnamClock(r.createdAt),
      ]),
    );
    const raw = await book.xlsx.writeBuffer();
    const content = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    return new StreamableFile(content, {
      type: XLSX_MIME,
      disposition: `attachment; filename="StayReco_giao-dich_${period.from}_${period.to}.xlsx"`,
      length: content.length,
    });
  }

  @ApiOperation({
    summary: 'One transaction in full',
    description:
      'The booking, the customer, the expected and the confirmed amount (a difference is flagged), the booking history and every wallet movement of the booking. No status check with SePay (M10): the detail shows what the webhook reported.',
  })
  @ApiData(adminTransactionDetailResponseSchema)
  @ApiErrors(ErrorCode.NOT_FOUND)
  @Get('transactions/:invoiceId')
  transaction(@Param('invoiceId') invoiceId: string) {
    return this.payments.transaction(invoiceId);
  }

  @ApiOperation({
    summary: 'The payment gateway settings, read-only',
    description:
      'Decision M10: server environment settings, the account number masked; changing them means changing the environment and restarting the API.',
  })
  @ApiData(paymentSettingsResponseSchema)
  @Get('payment-settings')
  settings(@Req() req: Request) {
    const proto =
      (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ??
      req.protocol;
    return this.payments.settings(
      `${proto}://${req.get('host')}/api/v1/payments/sepay/webhook`,
    );
  }

  @ApiOperation({
    summary: 'Check the payment settings',
    description:
      'Without calling SePay: a real receiving account (not the demo one), the webhook key set, a SePay notification in the last 7 days. Each check passes or says why not.',
  })
  @ApiData(paymentSettingsCheckResponseSchema)
  @Post('payment-settings/test')
  @HttpCode(HttpStatus.OK)
  test() {
    return this.payments.test();
  }
}
