import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createViolationSchema,
  evidenceLinkResponseSchema,
  policyViolationResponseSchema,
  policyViolationSummaryResponseSchema,
  suspensionRequestSchema,
  updateViolationSchema,
  uploadedEvidenceResponseSchema,
  violationListQuerySchema,
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
import { UploadedFileOf, UploadFile } from '../../common/upload/upload-file';
import { UserRole } from '../../generated/prisma/client';
import { ComplianceService } from './compliance.service';

class CreateViolationDto extends zodDto(createViolationSchema) {}
class UpdateViolationDto extends zodDto(updateViolationSchema) {}
class ViolationListQueryDto extends zodDto(violationListQuerySchema) {}
class SuspensionRequestDto extends zodDto(suspensionRequestSchema) {}

/** Compliance cases and suspension requests (UC72, UC73, SRS 3.14.5, BR-15; docs/api/manager.md). */
@ApiTags('compliance')
@Roles(UserRole.PLATFORM_MANAGER)
@Controller('policy-violations')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @ApiOperation({
    summary: 'Compliance cases, the most severe first',
    description:
      '`OPEN` and `INVESTIGATING` by default; `status` and `severity` may be repeated. Within a severity, the oldest first.',
  })
  @ApiPage(policyViolationSummaryResponseSchema)
  @Get()
  list(@Query() query: ViolationListQueryDto) {
    return this.compliance.list(query);
  }

  @UploadFile('document')
  @ApiOperation({
    summary: 'Upload one evidence file',
    description:
      'PDF, JPG or PNG up to 10 MB, stored privately. Pass the returned `fileId` in `evidence` when opening the case (at most 5).',
  })
  @ApiData(uploadedEvidenceResponseSchema, HttpStatus.CREATED)
  @Post('evidence')
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFileOf('document') file: Buffer,
  ) {
    return this.compliance.uploadEvidence(user, file);
  }

  @ApiOperation({
    summary: 'Open a compliance case about a partner',
    description:
      '`hotelId`, when given, must be a hotel of the partner. Each `evidence` id must come from `POST /policy-violations/evidence` by the same manager.',
  })
  @ApiData(policyViolationResponseSchema, HttpStatus.CREATED)
  @ApiErrors(ErrorCode.PARTNER_NOT_FOUND, ErrorCode.HOTEL_NOT_FOUND)
  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateViolationDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.compliance.create(user, dto, meta);
  }

  @ApiOperation({ summary: 'One case with its evidence and timeline' })
  @ApiData(policyViolationResponseSchema)
  @ApiErrors(ErrorCode.VIOLATION_NOT_FOUND)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.compliance.detail(id);
  }

  @ApiOperation({
    summary: 'Move the case along, change its severity, add a note',
    description:
      '`status` follows OPEN → INVESTIGATING → RESOLVED / DISMISSED (OPEN may close directly); a closed case cannot change. The note is required and kept in the timeline.',
  })
  @ApiData(policyViolationResponseSchema)
  @ApiErrors(ErrorCode.VIOLATION_NOT_FOUND, ErrorCode.VIOLATION_STATUS_CONFLICT)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateViolationDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.compliance.update(user, id, dto, meta);
  }

  @ApiOperation({
    summary: 'A 5-minute link to one evidence file',
    description:
      'Returns JSON, not a redirect, because a new browser tab cannot send the Bearer token.',
  })
  @ApiData(evidenceLinkResponseSchema)
  @ApiErrors(ErrorCode.VIOLATION_NOT_FOUND)
  @Get(':id/evidence/:index')
  evidence(
    @Param('id') id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.compliance.evidenceLink(id, index);
  }

  @ApiOperation({
    summary: 'Ask the admin to suspend the partner of an open case',
    description:
      'BR-15: the manager asks, the admin decides. One pending request per partner; not for a partner already suspended (`409 PARTNER_SUSPENDED`).',
  })
  @ApiData(policyViolationResponseSchema, HttpStatus.CREATED)
  @ApiErrors(
    ErrorCode.VIOLATION_NOT_FOUND,
    ErrorCode.VIOLATION_STATUS_CONFLICT,
    ErrorCode.SUSPENSION_REQUEST_PENDING,
    {
      code: ErrorCode.PARTNER_SUSPENDED,
      status: HttpStatus.CONFLICT,
      description: 'The partner is already suspended',
    },
  )
  @Post(':id/suspension-request')
  requestSuspension(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SuspensionRequestDto,
    @ReqMeta() meta: RequestMeta,
  ) {
    return this.compliance.requestSuspension(user, id, dto, meta);
  }
}
