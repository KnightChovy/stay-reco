import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminOverviewResponseSchema,
  adminReasonSchema,
  adminUserListQuerySchema,
  adminUserResponseSchema,
  adminUserSummaryResponseSchema,
  auditLogEntryResponseSchema,
  auditLogListQuerySchema,
  commissionRateSchema,
  platformRangeQuerySchema,
  suspensionRequestListQuerySchema,
  suspensionRequestResponseSchema,
} from '@stayreco/shared';
import {
  type AuthUser,
  CurrentUser,
} from '../../common/decorators/current-user.decorator';
import {
  ReqMeta,
  type RequestMeta,
} from '../../common/decorators/request-meta.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { zodDto } from '../../common/pipes/validation';
import {
  ApiData,
  ApiErrors,
  ApiPage,
} from '../../common/swagger/api-docs.decorators';
import { UserRole } from '../../generated/prisma/client';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminStatsService } from './admin-stats.service';
import { AuditLogsService } from './audit-logs.service';

class RangeQueryDto extends zodDto(platformRangeQuerySchema) {}
class AdminUserListQueryDto extends zodDto(adminUserListQuerySchema) {}
class AdminReasonDto extends zodDto(adminReasonSchema) {}
class CommissionRateDto extends zodDto(commissionRateSchema) {}
class SuspensionRequestListQueryDto extends zodDto(
  suspensionRequestListQuerySchema,
) {}
class AuditLogListQueryDto extends zodDto(auditLogListQuerySchema) {}

/** System administration (UC77, UC80, UC82, UC83; docs/api/admin.md). `ADMIN` only. */
@ApiTags('admin')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly accounts: AdminAccountsService,
    private readonly stats: AdminStatsService,
    private readonly logs: AuditLogsService,
  ) {}

  @ApiOperation({
    summary: 'The admin dashboard',
    description:
      'Accounts by role (new ones against the previous period), suspension requests waiting, SePay transfers that confirmed nothing or came late in the period, refunds waiting now, and the 10 latest WARNING or CRITICAL events. `from` and `to` together (at most 366 days), or neither for the last 30 days.',
  })
  @ApiData(adminOverviewResponseSchema)
  @Get('stats')
  overview(@Query() query: RangeQueryDto) {
    return this.stats.overview(query);
  }

  @ApiOperation({
    summary: 'Find any account',
    description:
      '`search` matches the name or the email; `role` and `status` may be repeated (deleted accounts only when asked for).',
  })
  @ApiPage(adminUserSummaryResponseSchema)
  @Get('users')
  users(@Query() query: AdminUserListQueryDto) {
    return this.accounts.list(query);
  }

  @ApiOperation({
    summary: 'One account with its timeline',
    description:
      "The account, its role's details, signed-in devices, a partner's suspension requests and the 50 latest audit events done by or about it.",
  })
  @ApiData(adminUserResponseSchema)
  @ApiErrors(ErrorCode.USER_NOT_FOUND)
  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.accounts.detail(id);
  }

  @ApiOperation({
    summary: 'Lock an account',
    description:
      '`ACTIVE` or `INVITED` → `SUSPENDED`: every session is revoked and the person cannot sign in. Not for admin accounts (403). Emailed with the reason.',
  })
  @ApiData(adminUserResponseSchema)
  @ApiErrors(ErrorCode.USER_NOT_FOUND, ErrorCode.ACCOUNT_STATUS_CONFLICT)
  @Post('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspend(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.suspend(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'Unlock an account',
    description:
      '`SUSPENDED` → `ACTIVE` (or `INVITED` for someone who never set a password). Staff turned off by their hotel are the partner’s to turn back on. Emailed with the reason.',
  })
  @ApiData(adminUserResponseSchema)
  @ApiErrors(ErrorCode.USER_NOT_FOUND, ErrorCode.ACCOUNT_STATUS_CONFLICT)
  @Post('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  activate(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.activate(user, id, dto, meta);
  }

  @ApiOperation({
    summary: "Set a partner's commission rate",
    description:
      'BR-13: 8–15 %, at most 2 decimals. Applies to bookings made from now on; each booking keeps the rate it was made with.',
  })
  @ApiData(adminUserResponseSchema)
  @ApiErrors(ErrorCode.PARTNER_NOT_FOUND)
  @Patch('partners/:partnerId/commission-rate')
  setCommissionRate(
    @CurrentUser() user: AuthUser,
    @Param('partnerId') partnerId: string,
    @Body() dto: CommissionRateDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.setCommissionRate(user, partnerId, dto, meta);
  }

  @ApiOperation({
    summary: 'Lift the suspension of a partner',
    description:
      'A `SUSPENDED` partner goes back to `APPROVED`: its active hotels are listed and bookable again. Emailed with the reason.',
  })
  @ApiData(adminUserResponseSchema)
  @ApiErrors(ErrorCode.PARTNER_NOT_FOUND, ErrorCode.PARTNER_STATUS_CONFLICT)
  @Post('partners/:partnerId/reinstate')
  @HttpCode(HttpStatus.OK)
  reinstate(
    @CurrentUser() user: AuthUser,
    @Param('partnerId') partnerId: string,
    @Body() dto: AdminReasonDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.reinstate(user, partnerId, dto, meta);
  }

  @ApiOperation({
    summary: 'Suspension requests from platform managers',
    description:
      '`PENDING` by default, oldest first; `status` may be repeated (decided ones newest first).',
  })
  @ApiPage(suspensionRequestResponseSchema)
  @Get('suspension-requests')
  suspensionRequests(@Query() query: SuspensionRequestListQueryDto) {
    return this.accounts.suspensionRequests(query);
  }

  @ApiOperation({
    summary: 'Approve a suspension request: the partner is suspended',
    description:
      "BR-15. The partner's hotels leave the search and take no new bookings; bookings already made are served; the owner can read but not change anything. The partner and the manager who asked are told.",
  })
  @ApiData(suspensionRequestResponseSchema)
  @ApiErrors(
    ErrorCode.SUSPENSION_REQUEST_NOT_FOUND,
    ErrorCode.SUSPENSION_STATUS_CONFLICT,
  )
  @Post('suspension-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.decide(user, id, true, dto, meta);
  }

  @ApiOperation({
    summary: 'Reject a suspension request',
    description:
      'The partner is not changed; the manager who asked is told the reason.',
  })
  @ApiData(suspensionRequestResponseSchema)
  @ApiErrors(
    ErrorCode.SUSPENSION_REQUEST_NOT_FOUND,
    ErrorCode.SUSPENSION_STATUS_CONFLICT,
  )
  @Post('suspension-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.accounts.decide(user, id, false, dto, meta);
  }

  @ApiOperation({
    summary: 'The audit log and security events',
    description:
      'Read-only, newest first. `from` / `to` together or neither (the last 7 days), at most 92 days. `action`, `severity` and `role` may be repeated; severity is derived from the action (`AUDIT_SEVERITY`). Account and ID card numbers in `details` are masked.',
  })
  @ApiPage(auditLogEntryResponseSchema)
  @Get('audit-logs')
  auditLogs(@Query() query: AuditLogListQueryDto) {
    return this.logs.list(query);
  }
}
